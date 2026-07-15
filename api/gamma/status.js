// Vercel Serverless Function — polt één keer de status van een Gamma-generatie.
// Browser herhaalt deze GET elke ~5s tot status 'completed' of 'failed'.
// Bij 'completed' bevat het antwoord gammaUrl (online bewerken) + exportUrl
// (directe download van het PPTX/PDF-bestand).
//
// Env-vars: GAMMA_API_KEY (+ SUPABASE_* voor auth).

import { authenticate } from '../_auth.js';

const GAMMA_BASE_URL = 'https://public-api.gamma.app/v1.0';

export default async function handler(req, res){
  if(req.method !== 'GET'){
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const auth = await authenticate(req);
  if(!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const apiKey = process.env.GAMMA_API_KEY;
  if(!apiKey){
    return res.status(500).json({ error: 'GAMMA_API_KEY ontbreekt op de server.' });
  }

  const id = (req.query && req.query.id) || '';
  if(!/^[A-Za-z0-9_-]{6,}$/.test(String(id))){
    return res.status(400).json({ error: 'Ongeldige generationId.' });
  }

  try {
    const r = await fetch(`${GAMMA_BASE_URL}/generations/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: { 'X-API-KEY': apiKey }
    });
    const text = await r.text();
    if(!r.ok){
      return res.status(r.status).json({ error: `Gamma poll-fout (${r.status}): ${text.slice(0, 300)}` });
    }
    let data; try { data = JSON.parse(text); } catch { data = {}; }
    return res.status(200).json({
      status: data.status || 'processing',
      gammaUrl: data.gammaUrl || null,
      exportUrl: data.exportUrl || null,
      error: data.error ? (data.error.message || 'Gamma-fout') : null
    });
  } catch(err){
    return res.status(502).json({ error: (err && err.message) || 'Gamma-poll mislukt.' });
  }
}
