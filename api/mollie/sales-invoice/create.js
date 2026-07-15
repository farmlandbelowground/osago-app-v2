// Vercel Serverless Function — Mollie Sales Invoice aanmaken.
// Drie use-cases:
//   1. Abo-aankoop:        { mode: 'subscription', planId, voucherCode? }
//      → server bouwt line items uit server-side plan-config + valideert de
//        voucher, en registreert een pending activation. Webhook activeert
//        het abo zodra Mollie 'paid' meldt.
//   2. Handmatige (admin): { mode: 'manual', targetUserId, description,
//                            lineItems: [{description, netAmount}],
//                            status?, memo?, paymentTerm? }
//      → admin bepaalt zelf de bedragen; klant krijgt gewoon een factuur
//        met betaal-link. Geen pending-activation (dus geen abo-effect).
//   3. Lead-validatie:     { mode: 'lead_validation', leadId, fee }
//      → wordt vanuit de klant getriggerd voor de eenmalige validatie-fee.
//        Webhook markeert de lead als pending_validation zodra 'paid'.
//
// Legacy: bodies met alleen `{planId, voucherCode}` worden nog als
// subscription-mode geïnterpreteerd voor backwards-compat met Fase A.
//
// Auth: ingelogde Supabase-user. Manual-mode is admin-only.

import { authenticate } from '../../_auth.js';
import {
  mollieFetch, supabaseFetch, buildRecipient, encodeRecipientIdentifier,
  vatContext, testmodeFlag, isLiveKey, appBaseUrl, normalizeInvoice
} from './_helpers.js';

// Server-side plan-config. HOUD DEZE IN SYNC met SUBSCRIPTION_PLANS in
// osago-bundle.js. Bewust hier ge-hardcoded (i.p.v. uit Supabase halen)
// zodat de prijs niet client-side manipuleerbaar is.
const PLANS = {
  'basic':             { label: 'Basis',                priceNet:  999 },
  'plus':              { label: 'Plus',                 priceNet: 1799 },
  'premium':           { label: 'Premium',              priceNet: 2499 },
  'valuation-basic':   { label: 'Waardebepaling Basis',   priceNet:  299 },
  'valuation-premium': { label: 'Waardebepaling Premium', priceNet: 1499 }
};

const SUBSCRIPTION_DURATION_MONTHS = 6;
const PAYMENT_TERM_DAYS = 14;

function moneyStr(n){
  const v = Math.round((Number(n) || 0) * 100) / 100;
  return v.toFixed(2);
}

function nlDate(ms){
  return new Date(ms).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' });
}

async function fetchUserContext(userId){
  const [pRes, cRes] = await Promise.all([
    supabaseFetch(`/rest/v1/profiles?id=eq.${userId}&select=id,email,first_name,last_name,company`),
    supabaseFetch(`/rest/v1/companies?user_id=eq.${userId}&select=*`)
  ]);
  const profile = Array.isArray(pRes.data) ? pRes.data[0] : null;
  const companyRow = Array.isArray(cRes.data) ? cRes.data[0] : null;
  if(!profile) return { user: null, company: null };
  const user = {
    id: profile.id,
    email: profile.email,
    firstName: profile.first_name,
    lastName: profile.last_name,
    company: profile.company
  };
  // De companies-tabel heeft alleen `name` en `kvk_nummer` als eigen kolommen
  // voor onze needs; adres- en btw-velden zitten in het `extra`-JSONB (zie
  // osago-data.js companyToRow). Merge daarom extra in.
  const extra = (companyRow && companyRow.extra && typeof companyRow.extra === 'object') ? companyRow.extra : {};
  const company = companyRow ? {
    name: companyRow.name || profile.company,
    kvkNummer: companyRow.kvk_nummer || extra.kvkNummer || null,
    vatNumber: extra.vatNumber || null,
    street: extra.street || null,
    houseNumber: extra.houseNumber || null,
    houseNumberAddition: extra.houseNumberAddition || extra.houseNumberExtra || null,
    postalCode: extra.postalCode || null,
    city: extra.city || null,
    country: extra.country || 'NL'
  } : { name: profile.company || null, country: 'NL' };
  return { user, company };
}

async function isCallerAdmin(userId){
  const url = process.env.SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    const pres = await fetch(
      `${url}/rest/v1/profiles?id=eq.${userId}&select=role`,
      { headers: { apikey: svc, Authorization: `Bearer ${svc}` } }
    );
    const rows = await pres.json();
    const role = Array.isArray(rows) && rows[0] ? rows[0].role : null;
    return role === 'admin' || role === 'admin_user';
  } catch(err){
    console.warn('[mollie sales-invoice create] rol-lookup fout:', err);
    return false;
  }
}

// Voucher-validatie tegen de Supabase `vouchers`-tabel. Kolom-namen moeten
// matchen met voucherToRow() in osago-data.js:
//   active (boolean, default true), valid_from/valid_until, max_uses,
//   used_count, applies_to (string — 'all' of plan-id), type
//   ('percentage' | 'fixed'), value (getal).
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
  // applies_to = 'all' → alle plannen; anders moet 'ie exact matchen.
  const appliesTo = row.applies_to || 'all';
  if(appliesTo !== 'all' && appliesTo !== planId) return null;
  return {
    id: row.id, code: row.code,
    type: row.type,           // 'percentage' | 'fixed'
    value: Number(row.value)  // percent (0-100) OF euro-bedrag afhankelijk van type
  };
}

// Berekening spiegelt de client (calculateVoucherDiscount in osago-bundle.js)
// zodat het bedrag in de betaal-modal 1-op-1 matcht met wat Mollie ontvangt.
function calcDiscount(voucher, priceNet){
  if(!voucher) return { discountNet: 0, finalNet: priceNet };
  const v = Number(voucher.value) || 0;
  const raw = voucher.type === 'percentage'
    ? priceNet * (v / 100)   // percent (0-100)
    : v;                      // 'fixed' of onbekend type: euro-bedrag
  // Rond op centen en cap tussen 0 en priceNet.
  const discountNet = Math.max(0, Math.min(priceNet, Math.round(raw * 100) / 100));
  const finalNet   = Math.round((priceNet - discountNet) * 100) / 100;
  return { discountNet, finalNet };
}

// ============================================================
// Mode-implementaties
// ============================================================

async function createSubscriptionInvoice({ body, callerUserId, targetUserId, source }){
  const planId = String(body.planId || '').trim();
  if(!planId || !PLANS[planId]){
    return { error: { status: 400, message: 'Onbekend of ontbrekend planId.' } };
  }
  const plan = PLANS[planId];

  const { user, company } = await fetchUserContext(targetUserId);
  if(!user) return { error: { status: 404, message: 'Gebruiker niet gevonden.' } };

  const voucher = await validateVoucherServerside(body.voucherCode, planId);
  const priceNet = plan.priceNet;
  const { discountNet, finalNet } = calcDiscount(voucher, priceNet);

  const { recipient, type } = buildRecipient(company, user);
  const identifier = encodeRecipientIdentifier(user.email, type);
  const vat = vatContext(company);

  const startMs = Date.now();
  const endMs   = (() => { const d = new Date(startMs); d.setMonth(d.getMonth() + SUBSCRIPTION_DURATION_MONTHS); return d.getTime(); })();
  const periodLabel = `${nlDate(startMs)} t/m ${nlDate(endMs)}`;
  const description = `Osago ${plan.label} — abonnement ${periodLabel}`;

  // Mollie accepteert geen negatieve unitPrice op sales invoices, dus we
  // consolideren de voucher-korting in één regel met de gecorrigeerde prijs.
  // Voucher-details noemen we in het `memo`-veld (invoice-note) i.p.v. in
  // de line-description — die is bij Mollie beperkt tot 100 tekens.
  const lines = [{
    description: description.slice(0, 100),
    quantity: 1,
    vatRate: vat.vatRate,
    unitPrice: { currency: 'EUR', value: moneyStr(finalNet) }
  }];

  const base = appBaseUrl();
  const webhookUrl = base ? `${base}/api/mollie/sales-invoice/webhook` : null;
  const memoParts = [`Periode: ${periodLabel}`];
  if(voucher){
    memoParts.push(`Voucher ${voucher.code}: korting ${moneyStr(discountNet)} op ${moneyStr(priceNet)}`);
  }
  if(vat.memo) memoParts.push(vat.memo);

  const payload = {
    status: 'issued',
    recipientIdentifier: identifier,
    vatScheme: 'standard',
    vatMode: 'exclusive',
    paymentTerm: `${PAYMENT_TERM_DAYS} days`,
    recipient,
    lines,
    memo: memoParts.join(' — '),
    emailDetails: {
      subject: `Factuur — Osago ${plan.label}`,
      body: `Beste ${user.firstName || 'klant'},\n\nHierbij ontvang je de factuur voor je Osago ${plan.label}-abonnement. Je kunt direct betalen via de link in deze mail.\n\nMet vriendelijke groet,\nOsago`
    }
  };
  if(webhookUrl) payload.webhookUrl = webhookUrl;
  if(testmodeFlag()) payload.testmode = true;

  const create = await mollieFetch('/sales-invoices', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if(!create.ok){
    console.warn('[mollie sales-invoice] create-fout (subscription):', create.status, create.data);
    return { error: {
      status: create.status || 502,
      message: (create.data && (create.data.detail || create.data.title)) || `HTTP ${create.status}`,
      upstream: create.data
    } };
  }

  // Pending activation persisteren zodat de webhook het abo kan activeren.
  const pend = await supabaseFetch('/rest/v1/mollie_pending_activations', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      sales_invoice_id: create.data.id,
      user_id: targetUserId,
      plan_id: planId,
      price_net: finalNet,
      list_price_net: priceNet,
      voucher_id: voucher ? voucher.id : null,
      voucher_code: voucher ? voucher.code : null,
      created_by: callerUserId,
      source
    })
  });
  if(!pend.ok){
    console.warn('[mollie sales-invoice] pending-activation-insert mislukt:', pend.status, pend.data);
  }
  return { invoiceId: create.data.id };
}

async function createManualInvoice({ body, callerUserId }){
  const targetUserId = String(body.targetUserId || '').trim();
  if(!targetUserId){
    return { error: { status: 400, message: 'targetUserId ontbreekt.' } };
  }
  const lineItems = Array.isArray(body.lineItems) ? body.lineItems : null;
  if(!lineItems || !lineItems.length){
    return { error: { status: 400, message: 'lineItems ontbreekt of is leeg.' } };
  }
  for(const li of lineItems){
    if(typeof li.netAmount !== 'number' || isNaN(li.netAmount)){
      return { error: { status: 400, message: 'lineItems.netAmount moet een getal zijn.' } };
    }
    if(!li.description || typeof li.description !== 'string'){
      return { error: { status: 400, message: 'lineItems.description ontbreekt.' } };
    }
    // Mollie sales invoices accepteren geen negatieve unitPrice. Vang dat
    // hier al af met een duidelijke boodschap zodat de admin niet naar een
    // rauwe Mollie-fout hoeft te kijken.
    if(li.netAmount < 0){
      return { error: { status: 400, message: 'Mollie accepteert geen negatieve bedragen. Werk kortingen/verrekeningen in in een positieve regel of pas de omschrijving aan.' } };
    }
  }

  const { user, company } = await fetchUserContext(targetUserId);
  if(!user) return { error: { status: 404, message: 'Doel-gebruiker niet gevonden.' } };

  const { recipient, type } = buildRecipient(company, user);
  const identifier = encodeRecipientIdentifier(user.email, type);
  const vat = vatContext(company);

  const status = body.status === 'draft' ? 'draft' : 'issued';
  const paymentTermDays = Math.max(1, Math.min(120,
    parseInt(String(body.paymentTermDays || PAYMENT_TERM_DAYS), 10) || PAYMENT_TERM_DAYS));

  const lines = lineItems.map(li => ({
    description: String(li.description).slice(0, 100),
    quantity: Math.max(1, parseInt(String(li.quantity || 1), 10) || 1),
    vatRate: vat.vatRate,
    unitPrice: { currency: 'EUR', value: moneyStr(li.netAmount) }
  }));

  const memoParts = [];
  if(body.memo && typeof body.memo === 'string') memoParts.push(body.memo);
  if(vat.memo) memoParts.push(vat.memo);

  const base = appBaseUrl();
  const webhookUrl = base ? `${base}/api/mollie/sales-invoice/webhook` : null;

  const payload = {
    status,
    recipientIdentifier: identifier,
    vatScheme: 'standard',
    vatMode: 'exclusive',
    paymentTerm: `${paymentTermDays} days`,
    recipient,
    lines,
    memo: memoParts.join(' — ') || undefined
  };
  const subjectDesc = body.description && typeof body.description === 'string'
    ? body.description : 'Factuur van Osago';
  payload.emailDetails = {
    subject: subjectDesc,
    body: `Beste ${user.firstName || 'klant'},\n\nHierbij ontvang je een factuur van Osago. Je kunt direct betalen via de link in deze mail.\n\nMet vriendelijke groet,\nOsago`
  };
  if(webhookUrl) payload.webhookUrl = webhookUrl;
  if(testmodeFlag()) payload.testmode = true;

  const create = await mollieFetch('/sales-invoices', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if(!create.ok){
    console.warn('[mollie sales-invoice] create-fout (manual):', create.status, create.data);
    return { error: {
      status: create.status || 502,
      message: (create.data && (create.data.detail || create.data.title)) || `HTTP ${create.status}`,
      upstream: create.data
    } };
  }
  return { invoiceId: create.data.id };
}

async function createLeadValidationInvoice({ body, callerUserId }){
  const leadId = String(body.leadId || '').trim();
  const fee    = Number(body.fee);
  if(!leadId) return { error: { status: 400, message: 'leadId ontbreekt.' } };
  if(!fee || fee <= 0) return { error: { status: 400, message: 'Ongeldige fee.' } };

  const { user, company } = await fetchUserContext(callerUserId);
  if(!user) return { error: { status: 404, message: 'Gebruiker niet gevonden.' } };

  const { recipient, type } = buildRecipient(company, user);
  const identifier = encodeRecipientIdentifier(user.email, type);
  const vat = vatContext(company);

  const description = 'Validatie van lead door Osago';
  const lines = [
    { description, quantity: 1, vatRate: vat.vatRate,
      unitPrice: { currency: 'EUR', value: moneyStr(fee) } }
  ];

  const base = appBaseUrl();
  const webhookUrl = base ? `${base}/api/mollie/sales-invoice/webhook` : null;
  const memoParts = ['Eenmalige validatie-fee'];
  if(vat.memo) memoParts.push(vat.memo);

  const payload = {
    status: 'issued',
    recipientIdentifier: identifier,
    vatScheme: 'standard',
    vatMode: 'exclusive',
    paymentTerm: `${PAYMENT_TERM_DAYS} days`,
    recipient,
    lines,
    memo: memoParts.join(' — '),
    emailDetails: {
      subject: 'Factuur — Lead-validatie door Osago',
      body: `Beste ${user.firstName || 'klant'},\n\nHierbij ontvang je de factuur voor de validatie van een lead. Zodra de betaling is voldaan neemt Osago de validatie op.\n\nMet vriendelijke groet,\nOsago`
    }
  };
  if(webhookUrl) payload.webhookUrl = webhookUrl;
  if(testmodeFlag()) payload.testmode = true;

  const create = await mollieFetch('/sales-invoices', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if(!create.ok){
    console.warn('[mollie sales-invoice] create-fout (lead_validation):', create.status, create.data);
    return { error: {
      status: create.status || 502,
      message: (create.data && (create.data.detail || create.data.title)) || `HTTP ${create.status}`,
      upstream: create.data
    } };
  }

  const pend = await supabaseFetch('/rest/v1/mollie_pending_lead_validations', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      sales_invoice_id: create.data.id,
      user_id: callerUserId,
      lead_id: leadId,
      fee
    })
  });
  if(!pend.ok){
    console.warn('[mollie sales-invoice] pending-lead-validation-insert mislukt:', pend.status, pend.data);
  }
  return { invoiceId: create.data.id };
}

// ============================================================
// Router
// ============================================================

export default async function handler(req, res){
  if(req.method !== 'POST'){
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await authenticate(req);
  if(!auth.ok) return res.status(auth.status).json({ error: auth.error });
  const callerUserId = auth.user.id;

  let body = req.body;
  if(typeof body === 'string'){
    try { body = JSON.parse(body); } catch { body = null; }
  }
  if(!body) return res.status(400).json({ error: 'Ongeldige body.' });

  // Bepaal mode. Backwards-compat: body zonder mode maar met planId → subscription.
  let mode = String(body.mode || '').trim();
  if(!mode && body.planId) mode = 'subscription';
  if(!mode) return res.status(400).json({ error: 'mode ontbreekt.' });

  let result;
  if(mode === 'subscription'){
    result = await createSubscriptionInvoice({
      body, callerUserId, targetUserId: callerUserId, source: 'self-service'
    });
  } else if(mode === 'manual'){
    if(!await isCallerAdmin(callerUserId)){
      return res.status(403).json({ error: 'Alleen beheerders mogen handmatige facturen aanmaken.' });
    }
    result = await createManualInvoice({ body, callerUserId });
  } else if(mode === 'lead_validation'){
    result = await createLeadValidationInvoice({ body, callerUserId });
  } else {
    return res.status(400).json({ error: `Onbekende mode: ${mode}` });
  }

  if(result.error){
    const e = result.error;
    // Diagnostiek: geef de klant/admin altijd terug in welke Mollie-mode we
    // draaien. Dat is bepaald door de MOLLIE_API_KEY (live_... = live,
    // test_... = test) — niet door de dashboard-toggle in Mollie. Zonder
    // deze hint is een "recipient not verified"-fout in test-mode moeilijk
    // te diagnosticeren.
    const mollieMode = isLiveKey() ? 'live' : 'test';
    return res.status(e.status).json({
      error: e.message,
      upstream: e.upstream,
      mollieMode
    });
  }

  // Losse GET om paymentUrl + pdfUrl op te halen (lijst-items hebben lege
  // _links — zie handover-doc §7).
  const detail = await mollieFetch(`/sales-invoices/${result.invoiceId}`);
  const raw = detail.ok ? detail.data : { id: result.invoiceId };
  return res.status(200).json(normalizeInvoice(raw));
}
