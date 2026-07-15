// Vercel Serverless Function — KVK Handelsregister zoek-proxy.
// Frontend roept aan: GET /api/kvk/zoeken?q=...
// Wij forwarden naar https://api.kvk.nl/api/v1/zoeken met server-side apikey.

import { authenticate } from '../_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // Vereis een ingelogde gebruiker — voorkomt anoniem leegtrekken van de quota.
  const auth = await authenticate(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
  const apiKey = process.env.KVK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'KVK_API_KEY ontbreekt op de server.' });
  }
  const q = (req.query && req.query.q) || '';
  if (!q || String(q).trim().length < 2) {
    return res.status(400).json({ error: 'Zoekterm te kort (minimaal 2 tekens).' });
  }

  try {
    // KvK v2 search — v1 zoeken is deprecated. v2 ondersteunt ?naam=,
    // ?kvkNummer=, ?plaats=, ?postcode=, etc. Voor de vrije zoekterm-UX
    // gebruiken we ?naam= en vallen terug op ?kvkNummer= bij cijfer-input.
    const isNumeric = /^\d+$/.test(String(q).trim());
    const params = new URLSearchParams();
    if (isNumeric) params.append('kvkNummer', String(q).trim());
    else params.append('naam', String(q).trim());

    const url = `https://api.kvk.nl/api/v2/zoeken?${params.toString()}`;
    const upstream = await fetch(url, {
      headers: {
        'apikey': apiKey,
        'Accept': 'application/json'
      }
    });
    const body = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', 'application/json');
    return res.send(body);
  } catch (err) {
    return res.status(502).json({
      error: (err && err.message) || 'Upstream-call naar KVK mislukt'
    });
  }
}
