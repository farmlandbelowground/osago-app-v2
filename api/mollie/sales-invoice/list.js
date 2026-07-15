// Vercel Serverless Function — Mollie sales invoices ophalen.
// GET /api/mollie/sales-invoice/list                     → eigen facturen
// GET /api/mollie/sales-invoice/list?email=<klant>       → admin, per klant
// GET /api/mollie/sales-invoice/list?all=1               → admin, alles
//
// Valkuilen die dit endpoint afvangt (zie handover-doc §7):
// - Lijst-respons zit onder `_embedded.invoices` (niet `sales_invoices`).
// - Lijst-items hebben LEGE `_links`. Om paymentUrl + pdfUrl te krijgen doen
//   we per issued-factuur een losse GET /sales-invoices/{id}.
// - Filter op `recipient.email` én op het email-deel van `recipientIdentifier`
//   (die heeft #business/#consumer achtervoegsel).
//
// Auth: ingelogde Supabase-user. Klanten zien alleen hun eigen facturen.
// Admins mogen `email` of `all=1` gebruiken; anders vallen ze terug op de
// eigen inbox (handig voor testen).

import { authenticate } from '../../_auth.js';
import { mollieFetch, normalizeInvoice } from './_helpers.js';

export default async function handler(req, res){
  if(req.method !== 'GET'){
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await authenticate(req);
  if(!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const q = req.query || {};
  const queryEmail = String(q.email || '').trim().toLowerCase();
  const wantAll    = String(q.all || '') === '1';
  const sessionEmail = String(auth.user.email || '').trim().toLowerCase();

  // Voor de admin-modus vragen we de rol op via een aparte lookup — cheaper
  // dan authenticate({requireAdmin}) omdat we bij een klant-call daar geen
  // extra round-trip aan willen besteden.
  let isAdmin = false;
  if(queryEmail || wantAll){
    const url = process.env.SUPABASE_URL;
    const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
    try {
      const pres = await fetch(
        `${url}/rest/v1/profiles?id=eq.${auth.user.id}&select=role`,
        { headers: { apikey: svc, Authorization: `Bearer ${svc}` } }
      );
      const rows = await pres.json();
      const role = Array.isArray(rows) && rows[0] ? rows[0].role : null;
      isAdmin = role === 'admin' || role === 'admin_user';
    } catch(err){
      console.warn('[mollie sales-invoice list] rol-lookup fout:', err);
    }
    if(!isAdmin){
      return res.status(403).json({ error: 'Alleen beheerders mogen cross-user zoeken.' });
    }
  }

  const list = await mollieFetch('/sales-invoices?limit=100');
  if(!list.ok){
    console.warn('[mollie sales-invoice] list-fout:', list.status, list.data);
    return res.status(list.status || 502).json({
      error: (list.data && (list.data.detail || list.data.title)) || `HTTP ${list.status}`
    });
  }

  const all = (list.data && list.data._embedded && list.data._embedded.invoices) || [];

  // Bepaal welke facturen we teruggeven op basis van scope.
  let scoped;
  if(isAdmin && wantAll){
    scoped = all.slice();
  } else {
    const targetEmail = (isAdmin && queryEmail) ? queryEmail : sessionEmail;
    if(!targetEmail) return res.status(400).json({ error: 'Geen e-mailadres bekend.' });
    scoped = all.filter(inv => {
      const recEmail = String((inv.recipient && inv.recipient.email) || '').toLowerCase();
      const idEmail  = String(inv.recipientIdentifier || '').toLowerCase().split('#')[0];
      return recEmail === targetEmail || idEmail === targetEmail;
    });
  }

  // Verrijk alleen de facturen waarvoor paymentUrl relevant is (issued) én
  // pdf (issued/paid). Bespaart Mollie-calls op grote lijsten.
  await Promise.all(scoped.map(async (i, idx) => {
    if(i.status === 'draft' || i.status === 'cancelled') return;
    const r = await mollieFetch(`/sales-invoices/${i.id}`);
    if(r.ok) scoped[idx] = r.data;
  }));

  const invoices = scoped
    .map(normalizeInvoice)
    .sort((a, b) => {
      const ta = new Date(a.issuedAt || a.createdAt || 0).getTime();
      const tb = new Date(b.issuedAt || b.createdAt || 0).getTime();
      return tb - ta;
    });

  return res.status(200).json({ invoices });
}
