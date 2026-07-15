// Vercel Serverless Function — abo-activatie na klant-terugkeer van Mollie.
// Wordt aangeroepen door de bundle wanneer de klant met `?paid=1` in de URL
// terugkomt. Vangnet voor als Mollie's webhook nog niet is gefired.
//
// Body (optioneel): {paymentId}
//   - Wanneer meegegeven: alleen die payment reconcilen.
//   - Anders: alle pending payments voor deze user reconcilen.
//
// Reageert altijd met detail-info per checked paymentId, zodat de client
// een echte foutmelding kan tonen als iets faalt.

import { authenticate } from '../../_auth.js';
import { supabaseFetch, reconcilePayment } from '../sales-invoice/_helpers.js';

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
  const explicitPaymentId = body && typeof body.paymentId === 'string' ? body.paymentId.trim() : '';

  // Bouw lijst met paymentIds. Voeg de expliciete toe én alle pending
  // payments van deze user (vangnet voor als de expliciete is verlopen of
  // de client 'em niet meer heeft).
  const paymentIds = new Set();
  if(explicitPaymentId) paymentIds.add(explicitPaymentId);
  try {
    const pendRes = await supabaseFetch(
      `/rest/v1/mollie_pending_subscriptions?user_id=eq.${userId}&select=mollie_payment_id`
    );
    if(pendRes.ok && Array.isArray(pendRes.data)){
      pendRes.data.forEach(r => r && r.mollie_payment_id && paymentIds.add(r.mollie_payment_id));
    } else if(!pendRes.ok){
      console.warn('[return] pending-fetch fout:', pendRes.status, pendRes.data);
    }
  } catch(err){ console.warn('[return] pending-fetch exception:', err); }

  if(paymentIds.size === 0){
    return res.status(200).json({ activated: 0, checked: 0, results: [] });
  }

  const results = [];
  let activatedCount = 0;
  for(const pid of paymentIds){
    try {
      const result = await reconcilePayment(pid);
      results.push(Object.assign({ paymentId: pid }, result));
      if(result && result.activated) activatedCount++;
    } catch(err){
      console.warn(`[return] fout voor ${pid}:`, err);
      results.push({ paymentId: pid, activated: false, reason: 'exception', error: String(err && err.message || err) });
    }
  }

  return res.status(200).json({ activated: activatedCount, checked: paymentIds.size, results });
}
