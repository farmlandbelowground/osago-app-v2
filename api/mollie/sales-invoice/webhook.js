// Vercel Serverless Function — Mollie sales invoice webhook.
// Mollie POSTet `id=si_XXX` (form-encoded) telkens wanneer de status van
// de sales invoice verandert. Wij delegeren de logica aan reconcileInvoice()
// in _helpers.js — datzelfde helper wordt ook aangeroepen door de reconcile-
// endpoint als vangnet voor gemiste webhooks.
//
// Belangrijk:
// - Endpoint moet PUBLIEK zijn (geen auth) — Mollie stuurt zonder token.
// - Authenticiteit wordt geverifieerd via mollieFetch (alleen een geldige
//   server-side call slaagt).
// - Antwoorden ALTIJD met 200, ook bij fouten. Mollie retryt anders eindeloos.

import { reconcileInvoice } from './_helpers.js';

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

  let invoiceId = '';
  try {
    const body = await readBody(req);
    invoiceId = String((body && body.id) || '').trim();
  } catch(err){
    console.warn('[sales-invoice webhook] body-parse fout:', err);
    return res.status(200).end();
  }
  if(!invoiceId){
    console.warn('[sales-invoice webhook] geen invoice-id in body');
    return res.status(200).end();
  }

  try {
    const result = await reconcileInvoice(invoiceId);
    console.log(`[sales-invoice webhook] ${invoiceId} → activated=${result.activated} kind=${result.kind || '-'} reason=${result.reason || '-'}`);
  } catch(err){
    console.warn('[sales-invoice webhook] reconcile-exception:', err);
  }
  return res.status(200).end();
}
