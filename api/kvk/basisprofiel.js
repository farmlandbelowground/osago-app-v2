// Vercel Serverless Function — KVK basisprofiel proxy.
// Frontend roept aan: GET /api/kvk/basisprofiel?kvkNummer=68750110
// Wij forwarden naar https://api.kvk.nl/api/v1/basisprofielen/{nummer}

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
  const kvkNummer = (req.query && req.query.kvkNummer) || '';
  if (!/^\d{6,12}$/.test(String(kvkNummer))) {
    return res.status(400).json({ error: 'Ongeldig KVK-nummer.' });
  }

  try {
    const url = `https://api.kvk.nl/api/v1/basisprofielen/${encodeURIComponent(kvkNummer)}`;
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
