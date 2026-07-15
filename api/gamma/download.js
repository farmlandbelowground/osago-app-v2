// Vercel Serverless Function — haalt het gegenereerde bestand op en streamt
// de bytes terug, zodat de browser het in de Documentenkluis kan opslaan
// zónder dat de onderliggende generatie-dienst (URL) aan de klant wordt
// getoond. We vragen de generatie opnieuw op via de generationId, pakken de
// verse export-URL en proxyen de bytes.
//
// GET /api/gamma/download?id=<generationId>  → application/pdf bytes
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
    // 1. Verse export-URL ophalen via de generatie-status.
    const gen = await fetch(`${GAMMA_BASE_URL}/generations/${encodeURIComponent(id)}`, {
      headers: { 'X-API-KEY': apiKey }
    });
    if(!gen.ok){
      const t = await gen.text().catch(() => '');
      return res.status(gen.status).json({ error: `Generatie ophalen mislukt (${gen.status}): ${t.slice(0, 200)}` });
    }
    const data = await gen.json();
    const exportUrl = data && data.exportUrl;
    if(!exportUrl){
      return res.status(409).json({ error: 'Het document is nog niet gereed of heeft geen exporteerbaar bestand.' });
    }

    // 2. Het bestand zelf ophalen en de bytes doorgeven.
    const fileRes = await fetch(exportUrl);
    if(!fileRes.ok){
      return res.status(502).json({ error: `Bestand ophalen mislukt (${fileRes.status}).` });
    }
    const arrayBuf = await fileRes.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    const contentType = fileRes.headers.get('content-type') || 'application/pdf';

    res.status(200);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buf.length.toString());
    res.setHeader('Cache-Control', 'no-store');
    return res.send(buf);
  } catch(err){
    return res.status(502).json({ error: (err && err.message) || 'Download-proxy mislukt.' });
  }
}
