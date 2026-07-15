// Vercel Serverless Function — Mollie Payment webhook voor abo-aankopen.
// Mollie POSTet form-encoded `id=tr_XXX` telkens wanneer de payment-status
// verandert. Wij delegeren aan reconcilePayment() in sales-invoice/_helpers.js
// — datzelfde helper wordt ook aangeroepen door het return-endpoint als
// vangnet vanuit de client.
//
// Endpoint is publiek (geen auth). Authenticiteit via de mollieFetch die
// alleen met een geldige API-key slaagt.

import { reconcilePayment } from '../sales-invoice/_helpers.js';

async function readBody(req){
  if(req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)){
    return req.body;
  }
  let raw = '';
  if(typeof req.body === 'string') raw = req.body;
  else if(Buffer.isBuffer(req.body)) raw = req.body.toString('utf8');
  else {
    raw = await new Promise((resolve, reject) => {
      let buf = '';
      req.on('data', chunk => { buf += chunk; });
      req.on('end', () => resolve(buf));
      req.on('error', reject);
    });
  }
  const out = {};
  raw.split('&').forEach(pair => {
    if(!pair) return;
    const eq = pair.indexOf('=');
    if(eq < 0){ out[decodeURIComponent(pair)] = ''; return; }
    const k = decodeURIComponent(pair.slice(0, eq));
    const v = decodeURIComponent(pair.slice(eq + 1).replace(/\+/g, ' '));
    out[k] = v;
  });
  return out;
}

export default async function handler(req, res){
  if(req.method !== 'POST'){
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  let paymentId = '';
  try {
    const body = await readBody(req);
    paymentId = String((body && body.id) || '').trim();
  } catch(err){
    console.warn('[subscription payment-webhook] body-parse fout:', err);
    return res.status(200).end();
  }
  if(!paymentId){
    console.warn('[subscription payment-webhook] geen payment-id in body');
    return res.status(200).end();
  }

  try {
    const result = await reconcilePayment(paymentId);
    console.log(`[subscription payment-webhook] ${paymentId} → activated=${result.activated} reason=${result.reason || '-'}`);
  } catch(err){
    console.warn('[subscription payment-webhook] reconcile-exception:', err);
  }
  return res.status(200).end();
}
