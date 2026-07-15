// Vercel Serverless Function — Mollie Payment aanmaken voor abo-aankoop.
//
// Waarom Payments en niet Sales Invoicing?
// Sales Invoicing ondersteunt geen redirectUrl op de hosted invoice-payment-
// page, waardoor de klant na betaling niet terugkomt in de Osago-app.
// Payments (v2/payments) heeft wél `redirectUrl` + `webhookUrl` en is
// speciaal voor exact deze flow ontworpen. Een sales invoice wordt achteraf
// aangemaakt (met status='paid') door de webhook, puur voor audit-trail.
//
// Klant-flow:
//   1. POST hier met {planId, voucherCode?}
//   2. Server valideert plan, voucher, rekent finalPrice uit
//   3. Server maakt Mollie payment aan + slaat pending-record op
//   4. Response: {paymentId, checkoutUrl}
//   5. Client redirect klant naar checkoutUrl
//   6. Na betaling: Mollie stuurt klant naar redirectUrl (<APP_URL>/?paid=1)
//   7. Client boot detecteert ?paid=1 en roept /return-endpoint aan
//   8. Parallel: Mollie's payment-webhook fired ook (redundante fuse)

import { authenticate } from '../../_auth.js';
import { mollieFetch, supabaseFetch, appBaseUrl, isLiveKey } from '../sales-invoice/_helpers.js';

// Vouchers hebben historisch text-IDs (bv. 'vch_1783087606841') én latere
// echte UUIDs. Kolommen die als UUID gedefinieerd zijn accepteren alleen
// het UUID-formaat. Voor alle andere vouchers loggen we via voucher_code.
function isUuid(v){
  return typeof v === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

// Server-side plan-config — synchroon met SUBSCRIPTION_PLANS in de bundle.
const PLANS = {
  'basic':             { label: 'Basis',                  priceNet:  999 },
  'plus':              { label: 'Plus',                   priceNet: 1799 },
  'premium':           { label: 'Premium',                priceNet: 2499 },
  'valuation-basic':   { label: 'Waardebepaling Basis',   priceNet:  299 },
  'valuation-premium': { label: 'Waardebepaling Premium', priceNet: 1499 }
};

const SUBSCRIPTION_DURATION_MONTHS = 6;

function moneyStr(n){
  const v = Math.round((Number(n) || 0) * 100) / 100;
  return v.toFixed(2);
}

function nlDate(ms){
  return new Date(ms).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' });
}

async function validateVoucherServerside(code, planId){
  if(!code) return null;
  const norm = String(code).trim().toUpperCase();
  if(!norm) return null;
  const res = await supabaseFetch(
    `/rest/v1/vouchers?code=eq.${encodeURIComponent(norm)}&select=*`
  );
  const row = Array.isArray(res.data) ? res.data[0] : null;
  if(!row) return null;
  if(row.active === false) return null;
  const now = Date.now();
  if(row.valid_from && new Date(row.valid_from).getTime() > now) return null;
  if(row.valid_until && new Date(row.valid_until).getTime() < now) return null;
  if(row.max_uses && row.used_count && row.used_count >= row.max_uses) return null;
  const appliesTo = row.applies_to || 'all';
  if(appliesTo !== 'all' && appliesTo !== planId) return null;
  return { id: row.id, code: row.code, type: row.type, value: Number(row.value) };
}

function calcDiscount(voucher, priceNet){
  if(!voucher) return { discountNet: 0, finalNet: priceNet };
  const v = Number(voucher.value) || 0;
  const raw = voucher.type === 'percentage' ? priceNet * (v / 100) : v;
  const discountNet = Math.max(0, Math.min(priceNet, Math.round(raw * 100) / 100));
  const finalNet   = Math.round((priceNet - discountNet) * 100) / 100;
  return { discountNet, finalNet };
}

export default async function handler(req, res){
  if(req.method !== 'POST'){
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await authenticate(req);
  if(!auth.ok) return res.status(auth.status).json({ error: auth.error });
  const userId = auth.user.id;

  let body = req.body;
  if(typeof body === 'string'){
    try { body = JSON.parse(body); } catch { body = null; }
  }
  if(!body) return res.status(400).json({ error: 'Ongeldige body.' });

  const planId = String(body.planId || '').trim();
  if(!planId || !PLANS[planId]){
    return res.status(400).json({ error: 'Onbekend of ontbrekend planId.' });
  }
  const plan = PLANS[planId];

  const voucher = await validateVoucherServerside(body.voucherCode, planId);
  const priceNet = plan.priceNet;
  const { finalNet } = calcDiscount(voucher, priceNet);
  // Bruto (incl. 21% BTW NL-default) — Mollie ontvangt een all-in bedrag.
  // Buitenlandse BTW-scenarios kunnen we niet hier onderscheiden zonder de
  // company-data op te halen; voor 99% van de klanten is NL-standaard.
  const grossGross = Math.round(finalNet * 1.21 * 100) / 100;

  const startMs = Date.now();
  const endMs   = (() => { const d = new Date(startMs); d.setMonth(d.getMonth() + SUBSCRIPTION_DURATION_MONTHS); return d.getTime(); })();
  const description = `Osago ${plan.label} — abonnement ${nlDate(startMs)} t/m ${nlDate(endMs)}`.slice(0, 250);

  const base = appBaseUrl();
  if(!base){
    return res.status(500).json({ error: 'APP_URL ontbreekt op de server.' });
  }
  const redirectUrl = `${base}/?paid=1`;
  const webhookUrl  = `${base}/api/mollie/subscription/payment-webhook`;

  const payload = {
    amount: { currency: 'EUR', value: moneyStr(grossGross) },
    description,
    redirectUrl,
    webhookUrl,
    metadata: {
      userId, planId,
      voucherId: voucher ? voucher.id : null,
      voucherCode: voucher ? voucher.code : null,
      priceNet, finalNet
    }
  };
  // Testmode-flag alleen sturen als key een test_-key is (spiegelt sales-invoice).
  if(!isLiveKey()) payload.testmode = true;

  const create = await mollieFetch('/payments', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if(!create.ok){
    console.warn('[subscription create-payment] Mollie-fout:', create.status, create.data);
    return res.status(create.status || 502).json({
      error: (create.data && (create.data.detail || create.data.title)) || `HTTP ${create.status}`,
      mollieMode: isLiveKey() ? 'live' : 'test'
    });
  }

  const paymentId   = create.data && create.data.id;
  const checkoutUrl = create.data && create.data._links && create.data._links.checkout && create.data._links.checkout.href;
  if(!paymentId || !checkoutUrl){
    return res.status(502).json({ error: 'Onvolledige Mollie-response.' });
  }

  // Pending-record: link paymentId aan userId + planId zodat webhook/return
  // de activatie kan afhandelen.
  const pend = await supabaseFetch('/rest/v1/mollie_pending_subscriptions', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      mollie_payment_id: paymentId,
      user_id: userId,
      plan_id: planId,
      price_net: finalNet,
      list_price_net: priceNet,
      voucher_id: (voucher && isUuid(voucher.id)) ? voucher.id : null,
      voucher_code: voucher ? voucher.code : null
    })
  });
  if(!pend.ok){
    console.warn('[subscription create-payment] pending-insert mislukt:', pend.status, pend.data);
    // Niet fataal — payment is aangemaakt. Webhook zal 't nog kunnen redden
    // via metadata (userId, planId).
  }

  return res.status(200).json({ paymentId, checkoutUrl });
}
