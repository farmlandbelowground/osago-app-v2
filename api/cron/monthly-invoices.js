// Vercel Cron — daily job that generates renewal invoices for subscriptions.
//
// Draait dagelijks (schedule in vercel.json). Voor elke actieve subscription
// met auto_renew=true én end_date binnen RENEWAL_LEAD_TIME_DAYS: maakt een
// Mollie sales invoice aan voor de volgende termijn. Idempotent via de
// tabel `subscription_billing_periods` (unieke key = user_id + period_start).
//
// Beveiliging:
// - Vercel Cron zet een `Authorization: Bearer $CRON_SECRET` header.
// - We valideren die tegen process.env.CRON_SECRET. Zonder match → 401.
//
// Wat de cron NIET doet:
// - Ze verlengt niet zelf de subscription — dat doet de webhook zodra Mollie
//   'paid' meldt. Zolang de factuur niet betaald wordt, blijft het huidige
//   abo lopen tot end_date en gaat 't daarna 'inactief' (front-end besluit).
// - Ze bemoeit zich niet met verlopen facturen — geen incasso-herinneringen
//   in Fase C. Mollie's eigen herinneringsmails moeten dat opvangen.

const RENEWAL_LEAD_TIME_DAYS = 14;
const SUBSCRIPTION_DURATION_MONTHS = 6;

// Server-side plan-config — MOET synchroon blijven met create.js + bundle.
const PLANS = {
  'basic':             { label: 'Basis',                  priceNet:  999 },
  'plus':              { label: 'Plus',                   priceNet: 1799 },
  'premium':           { label: 'Premium',                priceNet: 2499 },
  'valuation-basic':   { label: 'Waardebepaling Basis',   priceNet:  299 },
  'valuation-premium': { label: 'Waardebepaling Premium', priceNet: 1499 }
};

async function supabaseFetch(path, opts = {}){
  const url = process.env.SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url || !svc) throw new Error('Supabase server-config ontbreekt.');
  const headers = Object.assign({
    apikey: svc,
    Authorization: `Bearer ${svc}`,
    'Content-Type': 'application/json'
  }, opts.headers || {});
  const res = await fetch(`${url}${path}`, { ...opts, headers });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

async function callInternal(path, body, cookieHeader){
  // De cron heeft geen sessie-cookie; we posten via een interne shortcut die
  // niet door authenticate() gaat — daarvoor moeten we een aparte cron-mode
  // in de create-endpoint hebben, of hier direct bij Mollie posten. Zie de
  // createMollieInvoice hieronder — we bouwen de payload zelf en calln Mollie
  // rechtstreeks, want de cron heeft geen ingelogde user.
  return null;
}

function moneyStr(n){
  const v = Math.round((Number(n) || 0) * 100) / 100;
  return v.toFixed(2);
}

function nlDate(iso){
  return new Date(iso).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isoDay(d){
  return d.toISOString().slice(0, 10);
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
  // companies-tabel: alleen `name` en `kvk_nummer` als eigen kolommen; adres/
  // btw zitten in het `extra`-JSONB (zie osago-data.js companyToRow).
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

const EU_COUNTRIES = new Set([
  'AT','BE','BG','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HR','HU','IE',
  'IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK'
]);

function buildRecipient(company, user){
  const country = String((company && company.country) || 'NL').slice(0, 2).toUpperCase();
  const email   = String((user && user.email) || '').trim();
  const kvk     = String((company && company.kvkNummer) || '').replace(/\s+/g, '').trim();
  const vat     = String((company && company.vatNumber) || '').replace(/\s+/g, '').trim();
  const type = (kvk || vat) ? 'business' : 'consumer';
  const rec = {
    type, email,
    streetAndNumber: [company && company.street, company && company.houseNumber, company && company.houseNumberAddition]
      .filter(Boolean).join(' ').trim() || '',
    postalCode: (company && company.postalCode) || '',
    city: (company && company.city) || '',
    country, locale: 'nl_NL'
  };
  if(type === 'business'){
    rec.organizationName = (company && company.name) || (user && user.company) || '';
    if(vat) rec.vatNumber = vat;
    if(kvk) rec.organizationNumber = kvk;
  } else {
    rec.givenName  = (user && user.firstName) || '';
    rec.familyName = (user && user.lastName)  || '';
  }
  return { recipient: rec, type };
}

function vatContext(company){
  const country = String((company && company.country) || 'NL').slice(0, 2).toUpperCase();
  const hasVat  = !!(company && company.vatNumber);
  if(country === 'NL') return { vatRate: '21.00', memo: null };
  if(EU_COUNTRIES.has(country) && hasVat){
    return {
      vatRate: '0.00',
      memo: 'Btw verlegd (reverse charge) — art. 196 Richtlijn 2006/112/EG.'
    };
  }
  return { vatRate: '0.00', memo: null };
}

function encodeRecipientIdentifier(baseEmail, type){
  return `${String(baseEmail || '').trim().toLowerCase()}#${type === 'business' ? 'business' : 'consumer'}`;
}

function appBaseUrl(){
  const explicit = process.env.APP_URL;
  if(explicit && /^https?:\/\//.test(explicit)) return explicit.replace(/\/$/, '');
  const vercel = process.env.VERCEL_URL;
  if(vercel) return `https://${vercel.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
  return null;
}

async function createMollieInvoice(sub, user, company, nextStartMs, nextEndMs){
  const plan = PLANS[sub.type];
  if(!plan) throw new Error(`Onbekend plan-type: ${sub.type}`);
  const priceNet = Number(sub.price) || plan.priceNet;
  const { recipient, type } = buildRecipient(company, user);
  const identifier = encodeRecipientIdentifier(user.email, type);
  const vat = vatContext(company);
  const periodLabel = `${nlDate(nextStartMs)} t/m ${nlDate(nextEndMs)}`;
  const description = `Osago ${plan.label} — abonnement ${periodLabel}`;
  const base = appBaseUrl();
  const webhookUrl = base ? `${base}/api/mollie/sales-invoice/webhook` : null;
  const memoParts = [`Periode: ${periodLabel}`];
  if(vat.memo) memoParts.push(vat.memo);

  const payload = {
    status: 'issued',
    recipientIdentifier: identifier,
    vatScheme: 'standard',
    vatMode: 'exclusive',
    paymentTerm: '14 days',
    recipient,
    lines: [{
      description: description.slice(0, 100), quantity: 1, vatRate: vat.vatRate,
      unitPrice: { currency: 'EUR', value: moneyStr(priceNet) }
    }],
    memo: memoParts.join(' — '),
    emailDetails: {
      subject: `Factuur — Osago ${plan.label}`,
      body: `Beste ${user.firstName || 'klant'},\n\nHierbij ontvang je de factuur voor de verlenging van je Osago ${plan.label}-abonnement. Je kunt direct betalen via de link in deze mail.\n\nMet vriendelijke groet,\nOsago`
    }
  };
  if(webhookUrl) payload.webhookUrl = webhookUrl;
  if(!(process.env.MOLLIE_API_KEY || '').startsWith('live_')) payload.testmode = true;

  const apiKey = process.env.MOLLIE_API_KEY;
  if(!apiKey) throw new Error('MOLLIE_API_KEY ontbreekt.');
  const res = await fetch('https://api.mollie.com/v2/sales-invoices', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if(!res.ok){
    throw new Error((data && (data.detail || data.title)) || `HTTP ${res.status}`);
  }
  return data;
}

export default async function handler(req, res){
  if(req.method !== 'GET' && req.method !== 'POST'){
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  if(!secret || authHeader !== `Bearer ${secret}`){
    return res.status(401).json({ error: 'Ongeldige cron-token.' });
  }

  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + RENEWAL_LEAD_TIME_DAYS);
  const cutoffIso = isoDay(cutoff);

  // Haal alle subscriptions op die binnen de lead-time verlopen én auto-renew hebben.
  const subsRes = await supabaseFetch(
    `/rest/v1/subscriptions?auto_renew=eq.true&end_date=lte.${cutoffIso}&select=*`
  );
  if(!subsRes.ok){
    console.warn('[cron monthly-invoices] subs-fetch fout:', subsRes.status, subsRes.data);
    return res.status(502).json({ error: 'Kon subscriptions niet ophalen.' });
  }
  const subs = Array.isArray(subsRes.data) ? subsRes.data : [];

  const report = { total: subs.length, created: 0, skipped: 0, errors: [] };

  for(const sub of subs){
    try {
      // De nieuwe periode start op de dag na de huidige end_date.
      const currentEnd = new Date(sub.end_date);
      const nextStart = new Date(currentEnd); nextStart.setDate(nextStart.getDate() + 1);
      const nextEnd   = new Date(nextStart);  nextEnd.setMonth(nextEnd.getMonth() + SUBSCRIPTION_DURATION_MONTHS);
      const nextStartIso = isoDay(nextStart);

      // Idempotency-check: bestaat er al een billing-period-row voor deze
      // (user, periodStart)?
      const dupRes = await supabaseFetch(
        `/rest/v1/subscription_billing_periods?user_id=eq.${sub.user_id}&period_start=eq.${nextStartIso}&select=id`
      );
      if(Array.isArray(dupRes.data) && dupRes.data.length > 0){
        report.skipped++;
        continue;
      }

      const { user, company } = await fetchUserContext(sub.user_id);
      if(!user){
        report.errors.push({ user_id: sub.user_id, error: 'user-not-found' });
        continue;
      }

      const invoice = await createMollieInvoice(sub, user, company, nextStart.getTime(), nextEnd.getTime());

      // Registreer de period + pending-activation (zodat de webhook 'ie kan
      // activeren zodra 'ie 'paid' is).
      await Promise.all([
        supabaseFetch('/rest/v1/subscription_billing_periods', {
          method: 'POST',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({
            user_id: sub.user_id,
            period_start: nextStartIso,
            period_end: isoDay(nextEnd),
            sales_invoice_id: invoice.id
          })
        }),
        supabaseFetch('/rest/v1/mollie_pending_activations', {
          method: 'POST',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({
            sales_invoice_id: invoice.id,
            user_id: sub.user_id,
            plan_id: sub.type,
            price_net: sub.price,
            list_price_net: sub.list_price || sub.price,
            source: 'cron'
          })
        })
      ]);

      report.created++;
      console.log(`[cron monthly-invoices] ${sub.user_id} → ${invoice.id} (${nextStartIso})`);
    } catch(err){
      console.warn(`[cron monthly-invoices] fout voor ${sub.user_id}:`, err);
      report.errors.push({ user_id: sub.user_id, error: String(err && err.message || err) });
    }
  }

  return res.status(200).json(report);
}
