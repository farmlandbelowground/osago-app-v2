// Vercel Serverless Function — Unsplash-proxy voor de foto-picker op
// /verkooppresentatie-uitgebreid. Houdt de Access Key server-side; de
// browser krijgt alleen een genormaliseerde subset van de Unsplash-
// respons (thumb-URL, full-URL, credit) — geen ruwe Unsplash-payload.
//
// Verwachte env-vars:
//   UNSPLASH_ACCESS_KEY — vereist. Verkrijgen via
//     https://unsplash.com/oauth/applications (Access Key, niet Secret).
//
// Query: ?q=<zoekterm>&per_page=12 (per_page optioneel, default 12, max 30)
// Response: { results: [{ id, thumbUrl, fullUrl, credit }] }

const UNSPLASH_ENDPOINT = 'https://api.unsplash.com/search/photos';

export default async function handler(req, res){
  if(req.method !== 'GET'){
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if(!key){
    console.warn('[unsplash] UNSPLASH_ACCESS_KEY ontbreekt in env');
    return res.status(500).json({ error: 'Unsplash niet geconfigureerd op de server.' });
  }
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if(!q) return res.status(400).json({ error: 'Zoekterm ontbreekt.' });
  const perPageRaw = parseInt(req.query.per_page, 10);
  const perPage = Number.isFinite(perPageRaw)
    ? Math.min(Math.max(perPageRaw, 1), 30)
    : 12;
  const url = `${UNSPLASH_ENDPOINT}?query=${encodeURIComponent(q)}&per_page=${perPage}&content_filter=high`;
  try {
    const up = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${key}`,
        'Accept-Version': 'v1'
      }
    });
    const data = await up.json().catch(() => ({}));
    if(!up.ok){
      console.warn('[unsplash] search-fout:', up.status, data && data.errors);
      return res.status(up.status || 502).json({
        error: (Array.isArray(data.errors) && data.errors[0]) || `HTTP ${up.status}`
      });
    }
    const results = Array.isArray(data.results) ? data.results.map(r => ({
      id:       r.id,
      thumbUrl: (r.urls && (r.urls.thumb || r.urls.small)) || '',
      fullUrl:  (r.urls && (r.urls.regular || r.urls.full)) || '',
      credit:   r.user ? `${r.user.name || ''} @ Unsplash` : 'Unsplash'
    })) : [];
    return res.status(200).json({ results, total: data.total || results.length });
  } catch(err){
    console.warn('[unsplash] fetch-exception:', err);
    return res.status(502).json({ error: (err && err.message) || 'Unsplash-fetch mislukt.' });
  }
}
