// Vercel Serverless Function — Mollie sales invoice draft verwijderen.
// DELETE /api/mollie/sales-invoice/delete?id=si_XXX
//
// Alleen drafts zijn te verwijderen (issued/paid niet — Mollie retourneert
// dan 4xx). In testmode moeten we {"testmode": true} in de body meesturen,
// anders 422 "Field 'testmode' cannot be set to 'live' while in test mode"
// (zie handover-doc §10).
//
// Auth: alleen admins. Reguliere klanten mogen geen facturen deleten.

import { authenticate } from '../../_auth.js';
import { mollieFetch, testmodeFlag } from './_helpers.js';

export default async function handler(req, res){
  if(req.method !== 'DELETE'){
    res.setHeader('Allow', 'DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await authenticate(req, { requireAdmin: true });
  if(!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const id = String((req.query && req.query.id) || '').trim();
  if(!/^si_/.test(id)){
    return res.status(400).json({ error: 'Ongeldig sales-invoice-id.' });
  }

  const body = testmodeFlag() ? { testmode: true } : {};
  const del = await mollieFetch(`/sales-invoices/${id}`, {
    method: 'DELETE',
    body: JSON.stringify(body)
  });
  if(!del.ok){
    console.warn('[sales-invoice delete] Mollie-fout:', del.status, del.data);
    return res.status(del.status || 502).json({
      error: (del.data && (del.data.detail || del.data.title)) || `HTTP ${del.status}`
    });
  }
  return res.status(200).json({ ok: true });
}
