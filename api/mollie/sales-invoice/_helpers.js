// Shared helpers voor de Mollie Sales Invoicing endpoints.
// - buildRecipient(company, user): kiest business/consumer, gebruikt kvkNummer
//   als organizationNumber (Mollie accepteert dit als alternatief voor
//   vatNumber — zie handover-doc §6).
// - encodeRecipientIdentifier(email, type): codeert het type in de identifier
//   om de Mollie recipient-type-lock te omzeilen (§5).
// - vatRateFor(country, hasVatNumber): NL=21, EU met VAT=0 (reverse charge),
//   buiten EU=0 (§4).
// - normalizeInvoice(inv): mapt Mollie's response naar wat de front-end
//   verwacht (§9).
// - supabaseFetch(path, opts): kleine wrapper met service-role-key headers.

const MOLLIE_BASE = 'https://api.mollie.com/v2';

// EU-lidstaten (ISO 3166-1 alpha-2) — voor btw-verlegging bij business-to-business.
const EU_COUNTRIES = new Set([
  'AT','BE','BG','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HR','HU','IE',
  'IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK'
]);

export function isLiveKey(){
  return typeof process.env.MOLLIE_API_KEY === 'string'
    && process.env.MOLLIE_API_KEY.startsWith('live_');
}

// Testmode-vlag: alleen sturen als de key een test-key is (bij live-key mag
// hij niet mee, geeft 422 "cannot be set to 'live' in test mode" — omgekeerd).
export function testmodeFlag(){
  return isLiveKey() ? false : true;
}

export async function mollieFetch(path, opts = {}){
  const apiKey = process.env.MOLLIE_API_KEY;
  if(!apiKey) throw new Error('MOLLIE_API_KEY ontbreekt op de server.');
  const headers = Object.assign({
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }, opts.headers || {});
  const res = await fetch(`${MOLLIE_BASE}${path}`, { ...opts, headers });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

// Codeer het recipient-type in de identifier zodat business- en consumer-
// facturen voor dezelfde e-mail nooit botsen op Mollie's type-lock.
export function encodeRecipientIdentifier(baseEmail, type){
  const b = String(baseEmail || '').trim().toLowerCase();
  const t = type === 'business' ? 'business' : 'consumer';
  return `${b}#${t}`;
}

// Bouw het recipient-object. Regel: KvK-nummer aanwezig → business (met
// organizationNumber). Anders → consumer (given/family name).
export function buildRecipient(company, user){
  const country = String((company && company.country) || 'NL').slice(0, 2).toUpperCase();
  const email   = String((user && user.email) || (company && company.email) || '').trim();
  const kvk     = String((company && company.kvkNummer) || '').replace(/\s+/g, '').trim();
  const vat     = String((company && company.vatNumber) || '').replace(/\s+/g, '').trim();

  const type = (kvk || vat) ? 'business' : 'consumer';
  const rec = {
    type,
    email,
    streetAndNumber: [company && company.street, company && company.houseNumber, company && company.houseNumberAddition]
      .filter(Boolean).join(' ').trim() || (company && company.address) || '',
    postalCode: (company && company.postalCode) || '',
    city: (company && company.city) || '',
    country,
    locale: 'nl_NL'
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

// Bepaal het BTW-tarief.
// NL → 21%. EU met VAT-nummer op de klant → 0% (reverse charge). Buiten EU → 0%.
// Geef ook een `memo`-noot terug wanneer btw wordt verlegd.
export function vatContext(company){
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

// Bepaal de webhook-URL voor Mollie op basis van env-vars. Fallback naar
// VERCEL_URL (auto-gezet door Vercel) als APP_URL niet is ingesteld.
export function appBaseUrl(){
  const explicit = process.env.APP_URL;
  if(explicit && /^https?:\/\//.test(explicit)) return explicit.replace(/\/$/, '');
  const vercel = process.env.VERCEL_URL;
  if(vercel) return `https://${vercel.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
  return null;
}

// Herkent een creditnota. Mollie's sales-invoice-response kan het type
// meesturen ('credit_note' / 'credit'); als fallback checken we het nummer-
// prefix (Mollie-creditnota's beginnen met "C-" of "CN-") of een negatief
// totaalbedrag.
function detectCreditNote(inv){
  if(!inv) return false;
  const type = String(inv.type || '').toLowerCase();
  if(type === 'credit_note' || type === 'creditnote' || type === 'credit') return true;
  const num = String(inv.invoiceNumber || '');
  if(/^C[-_N]/i.test(num)) return true;
  // Totaal factuurbedrag (incl. BTW) — nooit `amountDue` eerst, want dat
  // veld valt na betaling op 0 en zou de factuur ineens €0 laten lijken.
  const total = (inv && (inv.totalAmount || inv.amount || inv.amountDue)) || {};
  const val = total.value != null ? Number(total.value) : NaN;
  if(!isNaN(val) && val < 0) return true;
  return false;
}

// Normaliseer een Mollie-invoice naar het minimale model dat de front-end
// nodig heeft. `_links.pdfLink` en `_links.invoicePayment` zitten ALLEEN op
// een losse GET, niet op de lijst — zie handover-doc §7.
export function normalizeInvoice(inv){
  // Totaal factuurbedrag (incl. BTW) — nooit `amountDue` eerst, want dat
  // veld valt na betaling op 0 en zou de factuur ineens €0 laten lijken.
  const total = (inv && (inv.totalAmount || inv.amount || inv.amountDue)) || {};
  const recipient = (inv && inv.recipient) || {};
  const isCreditNote = detectCreditNote(inv);
  return {
    id: inv.id,
    number: inv.invoiceNumber || inv.id,
    status: inv.status, // draft | issued | paid | cancelled
    isCreditNote,
    recipientIdentifier: inv.recipientIdentifier || null,
    recipientEmail: String(recipient.email || '').toLowerCase(),
    recipientName: recipient.organizationName
      || [recipient.givenName, recipient.familyName].filter(Boolean).join(' ')
      || null,
    period: inv.memo || '',
    description: firstLineDescription(inv),
    grossValue: total.value != null ? Number(total.value) : null,
    currency: total.currency || 'EUR',
    pdfUrl: (inv._links && inv._links.pdfLink && inv._links.pdfLink.href) || null,
    paymentUrl: (inv._links && inv._links.invoicePayment && inv._links.invoicePayment.href) || null,
    createdAt: inv.createdAt || null,
    issuedAt: inv.issuedAt || null,
    paidAt: inv.paidAt || null,
    paymentTerm: inv.paymentTerm || null,
    dueAt: computeDueAt(inv)
  };
}

function firstLineDescription(inv){
  const lines = (inv && inv.lines) || [];
  if(!lines.length) return '';
  return String(lines[0].description || '').trim();
}

function computeDueAt(inv){
  if(!inv) return null;
  const base = inv.issuedAt || inv.createdAt;
  if(!base) return null;
  const m = String(inv.paymentTerm || '').match(/\d+/);
  const days = m ? parseInt(m[0], 10) : 14;
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// ============================================================
// Activation helpers — gedeeld tussen webhook.js (Mollie triggert) en
// reconcile.js (klant/boot-flow polt handmatig als vangnet voor gemiste
// webhooks). Beide moeten idempotent zijn: dubbele calls doen niks
// wanneer 't abo al actief is.
// ============================================================

const SUBSCRIPTION_DURATION_MONTHS = 6;
function isoDate(ms){ return new Date(ms).toISOString().slice(0, 10); }

// Voucher-IDs in Osago hebben historisch twee formaten: tekst zoals
// 'vch_1783087606841' (uit de admin-UI) én échte UUIDs (uit latere seeds).
// Postgres-kolommen die als UUID gedefinieerd zijn (bv. subscriptions.
// voucher_id) weigeren het tekst-formaat. Alleen echte UUIDs doorgeven —
// voor de rest is voucher_code voldoende voor tracking.
function isUuid(v){
  return typeof v === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}
function nlDate(ms){
  return new Date(ms).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' });
}
function euro(n){
  const v = Math.round((Number(n) || 0) * 100) / 100;
  return '€ ' + v.toFixed(2).replace('.', ',');
}

// Plan-labels — synchroon met SUBSCRIPTION_PLANS in osago-bundle.js.
const PLAN_LABELS = {
  'basic': 'Basis',
  'plus': 'Plus',
  'premium': 'Premium',
  'valuation-basic': 'Waardebepaling Basis',
  'valuation-premium': 'Waardebepaling Premium'
};

async function fetchProfile(userId){
  const res = await supabaseFetch(
    `/rest/v1/profiles?id=eq.${userId}&select=id,email,first_name,last_name,company,role`
  );
  return Array.isArray(res.data) ? res.data[0] : null;
}

async function fetchAdminEmails(){
  const res = await supabaseFetch(
    `/rest/v1/profiles?role=in.(admin,admin_user)&select=email`
  );
  if(!Array.isArray(res.data)) return [];
  return res.data.map(r => r && r.email).filter(Boolean);
}

// Lazy import van _email om circular-avoiding en kleine cold-starts.
// `opts` = { context, related } — gaat door naar de email_log-write in
// _email.js zodat de webhook/return-triggers filterbaar zijn in de tabel.
async function sendMail(templateId, to, vars, opts){
  try {
    const { sendTemplatedMail } = await import('../../_email.js');
    return await sendTemplatedMail(templateId, to, vars || {}, opts);
  } catch(err){
    console.warn(`[activation] sendMail ${templateId} exception:`, err);
    return { ok: false, error: (err && err.message) || 'send failed' };
  }
}

// `invoice` (optioneel) — de Mollie sales-invoice met o.a. invoiceNumber.
// Wordt gebruikt om `factuurnummer` mee te geven aan de subscription-mail.
export async function activateSubscriptionFromPending(pending, invoice){
  if(!pending || !pending.user_id || !pending.plan_id){
    console.warn('[activation] ongeldige pending — mist user_id of plan_id', pending);
    return { activated: false, reason: 'invalid-pending' };
  }
  const startMs = Date.now();
  const endMs   = (() => { const d = new Date(startMs); d.setMonth(d.getMonth() + SUBSCRIPTION_DURATION_MONTHS); return d.getTime(); })();

  // Bestaande sub ophalen — bepaalt of we PATCHen of POST'en, en of dit een
  // renewal is (voor de mail).
  const existing = await supabaseFetch(
    `/rest/v1/subscriptions?user_id=eq.${pending.user_id}&select=user_id,end_date,start_date`
  );
  if(!existing.ok){
    console.warn('[activation] existing-fetch mislukt:', existing.status, existing.data);
    return { activated: false, reason: 'existing-fetch-failed', debug: existing.data };
  }
  const existingRow = Array.isArray(existing.data) ? existing.data[0] : null;
  if(existingRow && existingRow.end_date && new Date(existingRow.end_date).getTime() >= startMs){
    console.log('[activation] abo al actief:', pending.user_id);
    return { activated: false, reason: 'already-active' };
  }
  const isRenewal = !!(existingRow && existingRow.start_date);

  // Waarderingen zijn eenmalig — geen auto-renew.
  const isOneOff = String(pending.plan_id || '').startsWith('valuation-');
  const row = {
    user_id: pending.user_id,
    type: pending.plan_id,
    price: Number(pending.price_net) || 0,
    list_price: Number(pending.list_price_net) || Number(pending.price_net) || 0,
    voucher_code: pending.voucher_code || null,
    voucher_id: isUuid(pending.voucher_id) ? pending.voucher_id : null,
    start_date: isoDate(startMs),
    end_date: isoDate(endMs),
    auto_renew: !isOneOff,
    history: []
  };

  // Atomische upsert op user_id. Vereist unique-constraint op subscriptions.
  // user_id — die is er al (bestaande code gebruikte 'resolution=merge-
  // duplicates' zonder on_conflict, wat op dezelfde constraint leunde).
  // Deze aanpak voorkomt races tussen concurrent webhook + /return.
  let up = await supabaseFetch('/rest/v1/subscriptions?on_conflict=user_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(row)
  });
  if(!up.ok){
    // Fallback voor als er (nog) geen unique constraint bestaat: expliciete
    // PATCH bij bestaande, POST bij nieuw. Kan wél racen maar is beter dan
    // helemaal falen.
    console.warn('[activation] upsert mislukt (val terug op patch-or-post):', up.status, up.data);
    if(existingRow){
      up = await supabaseFetch(`/rest/v1/subscriptions?user_id=eq.${pending.user_id}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify(row)
      });
    } else {
      up = await supabaseFetch('/rest/v1/subscriptions', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify(row)
      });
    }
  }
  if(!up.ok){
    console.warn('[activation] subscription-write definitief mislukt:', up.status, up.data);
    return { activated: false, reason: 'upsert-failed', debug: { status: up.status, body: up.data } };
  }
  console.log(`[activation] abo geactiveerd voor ${pending.user_id} (${pending.plan_id}) — ${isRenewal ? 'renewal' : 'first'}`);

  if(isUuid(pending.voucher_id)){
    await supabaseFetch(`/rest/v1/rpc/increment_voucher_usage`, {
      method: 'POST',
      body: JSON.stringify({ voucher_id: pending.voucher_id })
    }).catch(err => console.warn('[activation] voucher-inc mislukt:', err));
  }

  // Bevestigings-mail — non-blocking (fire-and-forget).
  try {
    const profile = await fetchProfile(pending.user_id);
    if(profile && profile.email){
      const vars = {
        voornaam: profile.first_name || '',
        plan_naam: PLAN_LABELS[pending.plan_id] || pending.plan_id,
        start_datum: nlDate(startMs),
        eind_datum: nlDate(endMs),
        bedrag: euro(pending.price_net),
        factuurnummer: (invoice && invoice.invoiceNumber) || ''
      };
      await sendMail(isRenewal ? 'subscription_renewed' : 'subscription_confirmed', profile.email, vars, {
        context: 'webhook.mollie.subscription',
        related: { userId: pending.user_id, planId: pending.plan_id, mollie_payment_id: pending.mollie_payment_id, isRenewal }
      });
    }
  } catch(err){ console.warn('[activation] sub-mail exception:', err); }

  return { activated: true, kind: isRenewal ? 'renewal' : 'confirmed' };
}

export async function activateLeadValidationFromPending(pending, invoice){
  const nowIso = new Date().toISOString();
  const patch = {
    validation_status: 'pending_validation',
    validation_paid_at: nowIso,
    validation_fee: pending.fee
  };
  const up = await supabaseFetch(
    `/rest/v1/leads?id=eq.${encodeURIComponent(pending.lead_id)}&user_id=eq.${pending.user_id}&lead_type=eq.manual`,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(patch)
    }
  );
  if(!up.ok){
    console.warn('[activation] lead-update mislukt:', up.status, up.data);
    return { activated: false, reason: 'lead-update-failed' };
  }

  // Bevestigingsmail naar klant + notificatie naar admin(s).
  try {
    const [profile, leadRes] = await Promise.all([
      fetchProfile(pending.user_id),
      supabaseFetch(`/rest/v1/leads?id=eq.${encodeURIComponent(pending.lead_id)}&select=name,type,contact_first_name,contact_last_name`)
    ]);
    const lead = Array.isArray(leadRes.data) ? leadRes.data[0] : null;
    const leadName = lead ? (lead.name || [lead.contact_first_name, lead.contact_last_name].filter(Boolean).join(' ') || 'onbekend') : 'onbekend';
    const leadOpts = {
      context: 'webhook.mollie.lead-validation',
      related: { userId: pending.user_id, leadId: pending.lead_id, mollie_payment_id: pending.mollie_payment_id }
    };
    if(profile && profile.email){
      await sendMail('lead_validation_requested_customer', profile.email, {
        voornaam: profile.first_name || '',
        lead_naam: leadName
      }, leadOpts);
    }
    const adminEmails = await fetchAdminEmails();
    if(adminEmails.length && profile){
      await sendMail('lead_validation_requested_admin', adminEmails, {
        klant_naam: [profile.first_name, profile.last_name].filter(Boolean).join(' '),
        klant_email: profile.email || '',
        klant_bedrijf: profile.company || '',
        lead_naam: leadName,
        lead_type: (lead && lead.type) || ''
      }, leadOpts);
    }
  } catch(err){ console.warn('[activation] lead-mail exception:', err); }

  return { activated: true };
}

// Kijkt bij Mollie of een specifieke sales invoice is betaald, en zo ja:
// zoekt de pending activation (sub OF lead-validation) en activeert die.
// Retourneert { activated: boolean, kind?: 'subscription'|'lead_validation' }.
export async function reconcileInvoice(invoiceId){
  const suffix = testmodeFlag() ? '?testmode=true' : '';
  const detail = await mollieFetch(`/sales-invoices/${invoiceId}${suffix}`);
  if(!detail.ok){
    return { activated: false, reason: 'mollie-fetch-failed' };
  }
  const status = detail.data && detail.data.status;
  if(status !== 'paid') return { activated: false, reason: `status=${status}` };

  // Sub-pending
  const pendRes = await supabaseFetch(
    `/rest/v1/mollie_pending_activations?sales_invoice_id=eq.${encodeURIComponent(invoiceId)}&select=*`
  );
  const pending = Array.isArray(pendRes.data) ? pendRes.data[0] : null;
  if(pending){
    const result = await activateSubscriptionFromPending(pending, detail.data);
    if(result.activated){
      await supabaseFetch(
        `/rest/v1/mollie_pending_activations?sales_invoice_id=eq.${encodeURIComponent(invoiceId)}`,
        { method: 'DELETE', headers: { Prefer: 'return=minimal' } }
      ).catch(() => {});
    }
    return { activated: !!result.activated, kind: 'subscription', reason: result.reason };
  }

  // Lead-validation-pending
  const leadRes = await supabaseFetch(
    `/rest/v1/mollie_pending_lead_validations?sales_invoice_id=eq.${encodeURIComponent(invoiceId)}&select=*`
  );
  const leadPending = Array.isArray(leadRes.data) ? leadRes.data[0] : null;
  if(leadPending){
    const result = await activateLeadValidationFromPending(leadPending, detail.data);
    if(result.activated){
      await supabaseFetch(
        `/rest/v1/mollie_pending_lead_validations?sales_invoice_id=eq.${encodeURIComponent(invoiceId)}`,
        { method: 'DELETE', headers: { Prefer: 'return=minimal' } }
      ).catch(() => {});
    }
    return { activated: !!result.activated, kind: 'lead_validation', reason: result.reason };
  }

  return { activated: false, reason: 'no-pending' };
}

// ============================================================
// Payment-based flow (nieuw sinds juli 2026) — voor abo-aankopen wordt
// Mollie Payments gebruikt i.p.v. Sales Invoicing zodat de klant na
// betaling via redirectUrl automatisch terugkomt in de app. De sales
// invoice wordt achteraf aangemaakt met status='paid' voor de audit-
// trail (klant ziet 'em in het facturen-overzicht).
// ============================================================

function moneyStr(n){
  const v = Math.round((Number(n) || 0) * 100) / 100;
  return v.toFixed(2);
}

const PLAN_LABELS_MAP = {
  'basic': 'Basis',
  'plus': 'Plus',
  'premium': 'Premium',
  'valuation-basic': 'Waardebepaling Basis',
  'valuation-premium': 'Waardebepaling Premium'
};

// Achteraf een Mollie Sales Invoice met status='paid' aanmaken voor een net
// geactiveerd abo. Puur voor audit — de klant heeft al betaald via Payments.
// Retourneert de invoice-details of null bij falen (niet-fataal — activatie
// is al gebeurd).
export async function createPaidSalesInvoiceForActivation(pending){
  try {
    const [pRes, cRes] = await Promise.all([
      supabaseFetch(`/rest/v1/profiles?id=eq.${pending.user_id}&select=id,email,first_name,last_name,company`),
      supabaseFetch(`/rest/v1/companies?user_id=eq.${pending.user_id}&select=*`)
    ]);
    const profile = Array.isArray(pRes.data) ? pRes.data[0] : null;
    const companyRow = Array.isArray(cRes.data) ? cRes.data[0] : null;
    if(!profile){
      console.warn('[audit-invoice] profile niet gevonden voor user', pending.user_id);
      return null;
    }
    if(!profile.email){
      console.warn('[audit-invoice] profile heeft geen email — Mollie weigert dan de recipient', pending.user_id);
      return null;
    }
    const user = {
      id: profile.id, email: profile.email,
      firstName: profile.first_name || '', lastName: profile.last_name || '',
      company: profile.company || ''
    };
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

    const { recipient, type } = buildRecipient(company, user);
    const identifier = encodeRecipientIdentifier(user.email, type);
    const vat = vatContext(company);

    const planLabel = PLAN_LABELS_MAP[pending.plan_id] || pending.plan_id;
    const description = `Osago ${planLabel} — abonnement`.slice(0, 100);
    const priceNet = Number(pending.price_net) || 0;

    // Bouw de payload strict — Mollie is streng op missende velden.
    const basePayload = {
      recipientIdentifier: identifier,
      vatScheme: 'standard',
      vatMode: 'exclusive',
      paymentTerm: '14 days',
      recipient,
      lines: [{
        description,
        quantity: 1,
        vatRate: vat.vatRate,
        unitPrice: { currency: 'EUR', value: moneyStr(priceNet) }
      }]
    };
    if(pending.voucher_code){
      basePayload.memo = `Voucher ${pending.voucher_code} toegepast`;
    }
    if(testmodeFlag()) basePayload.testmode = true;

    // Bij status='paid' vereist Mollie een transactie-referentie via het
    // `paymentDetails`-object: { source: 'payment', sourceReference: 'tr_...' }.
    // Zonder dat object (of met een verkeerd veld) weigert Mollie de create.
    // Bron: docs.mollie.com/reference/create-sales-invoice.
    const paymentId = pending.mollie_payment_id;
    const paymentDetails = paymentId
      ? { source: 'payment', sourceReference: paymentId }
      : null;

    // Strategie 1: create met status='paid' inclusief paymentDetails.
    if(paymentDetails){
      const paidPayload = Object.assign({
        status: 'paid',
        paymentDetails
      }, basePayload);
      console.log('[audit-invoice] poging 1: status=paid met paymentDetails.sourceReference=' + paymentId);
      const create1 = await mollieFetch('/sales-invoices', {
        method: 'POST',
        body: JSON.stringify(paidPayload)
      });
      if(create1.ok){
        console.log(`[audit-invoice] aangemaakt (paid): ${create1.data && create1.data.id}`);
        return create1.data;
      }
      console.warn('[audit-invoice] status=paid geweigerd:', create1.status, JSON.stringify(create1.data));
    } else {
      console.warn('[audit-invoice] geen mollie_payment_id op pending — sla poging 1 over');
    }

    // Strategie 2: fallback naar create als 'issued' + PATCH naar 'paid'
    // met paymentDetails. Aangepaste emailDetails zodat de klant geen
    // "please pay"-mail krijgt maar een bevestigingstoon.
    const issuedPayload = Object.assign({
      status: 'issued',
      emailDetails: {
        subject: `Bevestiging betaling — Osago abonnement`,
        body: `Beste ${user.firstName || 'klant'},\n\nHierbij een bevestiging van je betaling voor het Osago-abonnement. Je hoeft niks meer te doen — je account is direct geactiveerd.\n\nMet vriendelijke groet,\nOsago`
      }
    }, basePayload);
    console.log('[audit-invoice] poging 2: status=issued + PATCH naar paid');
    const create2 = await mollieFetch('/sales-invoices', {
      method: 'POST',
      body: JSON.stringify(issuedPayload)
    });
    if(!create2.ok){
      console.warn('[audit-invoice] status=issued ook geweigerd:', create2.status, JSON.stringify(create2.data));
      return null;
    }
    const invoiceId = create2.data && create2.data.id;
    console.log(`[audit-invoice] issued aangemaakt: ${invoiceId} — nu PATCH naar paid`);

    const patchBody = { status: 'paid' };
    if(paymentDetails) patchBody.paymentDetails = paymentDetails;
    if(testmodeFlag()) patchBody.testmode = true;
    const patch = await mollieFetch(`/sales-invoices/${invoiceId}`, {
      method: 'PATCH',
      body: JSON.stringify(patchBody)
    });
    if(!patch.ok){
      console.warn('[audit-invoice] PATCH naar paid mislukt:', patch.status, JSON.stringify(patch.data));
      return create2.data;
    }
    console.log(`[audit-invoice] PATCH naar paid geslaagd voor ${invoiceId}`);
    return patch.data || create2.data;
  } catch(err){
    console.warn('[audit-invoice] exception:', err);
    return null;
  }
}

// Kijkt bij Mollie of een specifieke Payment betaald is; als ja: zoekt de
// pending_subscription en activeert 't abo, maakt achteraf de audit-invoice,
// ruimt de pending-row op.
// Idempotent: als 't abo al actief is, doet 'ie niks nieuws.
export async function reconcilePayment(paymentId){
  if(!paymentId){
    return { activated: false, reason: 'no-payment-id' };
  }
  console.log(`[reconcilePayment] start ${paymentId}`);

  // Mollie's testmode-suffix mag alleen bij test-key. Bij live-key niet.
  const suffix = testmodeFlag() ? '?testmode=true' : '';
  const detail = await mollieFetch(`/payments/${encodeURIComponent(paymentId)}${suffix}`);
  if(!detail.ok){
    console.warn(`[reconcilePayment] Mollie-fetch fout: ${detail.status}`, detail.data);
    return { activated: false, reason: 'mollie-fetch-failed', debug: { status: detail.status, body: detail.data } };
  }
  const status = detail.data && detail.data.status;
  console.log(`[reconcilePayment] ${paymentId} → Mollie-status=${status}`);
  if(status !== 'paid'){
    return { activated: false, reason: `status=${status}` };
  }

  // Zoek pending subscription op paymentId.
  const pendRes = await supabaseFetch(
    `/rest/v1/mollie_pending_subscriptions?mollie_payment_id=eq.${encodeURIComponent(paymentId)}&select=*`
  );
  let pending = null;
  let source = null;
  if(pendRes.ok && Array.isArray(pendRes.data) && pendRes.data[0]){
    pending = pendRes.data[0];
    source = 'supabase-pending';
  } else if(!pendRes.ok){
    console.warn('[reconcilePayment] pending-fetch fout (tabel bestaat waarschijnlijk niet):', pendRes.status, pendRes.data);
  }

  // Fallback: reconstrueer pending vanuit Mollie's metadata. Werkt zelfs als
  // de mollie_pending_subscriptions-tabel niet bestaat of de insert bij
  // create-payment.js was gefaald.
  if(!pending){
    const meta = detail.data && detail.data.metadata;
    if(meta && meta.userId && meta.planId){
      pending = {
        mollie_payment_id: paymentId,
        user_id: String(meta.userId),
        plan_id: String(meta.planId),
        price_net: Number(meta.finalNet) || Number(meta.priceNet) || 0,
        list_price_net: Number(meta.priceNet) || Number(meta.finalNet) || 0,
        voucher_id: isUuid(meta.voucherId) ? meta.voucherId : null,
        voucher_code: meta.voucherCode || null
      };
      source = 'mollie-metadata';
      console.log(`[reconcilePayment] pending gereconstrueerd uit Mollie-metadata voor user ${meta.userId}`);
    } else {
      console.warn('[reconcilePayment] geen metadata beschikbaar', { meta });
    }
  }

  if(!pending){
    return { activated: false, reason: 'no-pending' };
  }
  console.log(`[reconcilePayment] pending source=${source}, user=${pending.user_id}, plan=${pending.plan_id}`);

  const result = await activateSubscriptionFromPending(pending);
  if(!result.activated){
    console.warn(`[reconcilePayment] activatie faalde: ${result.reason}`, result.debug || '');
    return { activated: false, kind: 'subscription', reason: result.reason, debug: result.debug };
  }
  console.log(`[reconcilePayment] activatie geslaagd (kind=${result.kind})`);

  // Audit: paid sales invoice aanmaken (best-effort). Faalt dit, dan blijft
  // de subscription toch geactiveerd — de factuur is puur voor audit-trail.
  let invoiceResult = null;
  try {
    invoiceResult = await createPaidSalesInvoiceForActivation(pending);
    console.log(`[reconcilePayment] audit sales-invoice: ${invoiceResult ? 'aangemaakt (' + invoiceResult.id + ')' : 'niet aangemaakt'}`);
  } catch(err){
    console.warn('[reconcilePayment] audit-invoice exception:', err);
  }

  // Pending-row opruimen (alleen als die er was — supabase-source).
  if(source === 'supabase-pending'){
    await supabaseFetch(
      `/rest/v1/mollie_pending_subscriptions?mollie_payment_id=eq.${encodeURIComponent(paymentId)}`,
      { method: 'DELETE', headers: { Prefer: 'return=minimal' } }
    ).catch(err => console.warn('[reconcilePayment] pending-delete mislukt:', err));
  }

  return { activated: true, kind: 'subscription', activationKind: result.kind, invoiceCreated: !!invoiceResult };
}

// Klein Supabase-wrappertje (service-role). Gebruikt PostgREST direct.
export async function supabaseFetch(path, opts = {}){
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
