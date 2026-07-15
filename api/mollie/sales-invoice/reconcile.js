// Vercel Serverless Function — reconciliatie-fallback voor pending
// Mollie-facturen. Wordt door de klant getriggerd (op boot na Mollie-return,
// en bij het openen van /account) om te vangen wat de webhook mogelijk heeft
// gemist: Mollie stuurt niet altijd betrouwbaar een sales-invoice-webhook,
// dus we polten hier zelf.
//
// Wat 't doet:
//   1. Haalt alle pending_activations + pending_lead_validations op voor de
//      ingelogde user.
//   2. Voor elke pending: vraagt bij Mollie de invoice-status op via
//      reconcileInvoice() in _helpers.js.
//   3. Als 'ie betaald is, activeert de sub / lead-validatie en ruimt de
//      pending-row op.
//   4. Retourneert { activated: number, checked: number }.

import { authenticate } from '../../_auth.js';
import { supabaseFetch, reconcileInvoice } from './_helpers.js';

export default async function handler(req, res){
  if(req.method !== 'POST'){
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await authenticate(req);
  if(!auth.ok) return res.status(auth.status).json({ error: auth.error });
  const userId = auth.user.id;

  // Verzamel alle pending sales-invoice-ids die bij deze user horen.
  const [subRes, leadRes] = await Promise.all([
    supabaseFetch(`/rest/v1/mollie_pending_activations?user_id=eq.${userId}&select=sales_invoice_id`),
    supabaseFetch(`/rest/v1/mollie_pending_lead_validations?user_id=eq.${userId}&select=sales_invoice_id`)
  ]);
  const ids = new Set();
  if(Array.isArray(subRes.data))  subRes.data.forEach(r => r && r.sales_invoice_id && ids.add(r.sales_invoice_id));
  if(Array.isArray(leadRes.data)) leadRes.data.forEach(r => r && r.sales_invoice_id && ids.add(r.sales_invoice_id));

  if(ids.size === 0){
    return res.status(200).json({ activated: 0, checked: 0 });
  }

  let activatedCount = 0;
  for(const invoiceId of ids){
    try {
      const result = await reconcileInvoice(invoiceId);
      if(result && result.activated) activatedCount++;
    } catch(err){
      console.warn(`[reconcile] fout voor ${invoiceId}:`, err);
    }
  }

  return res.status(200).json({ activated: activatedCount, checked: ids.size });
}
