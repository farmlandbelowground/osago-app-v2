// Vercel Serverless Function — proxy naar Anthropic API.
// Gebruikt door:
//   - Socials generator (admin-pagina)
//   - Genereer/Herschrijf-pills op /waarderingsrapport en
//     /verkooppresentatie-uitgebreid (klant én medewerker)
// Voegt de geheime ANTHROPIC_API_KEY server-side toe en stuurt de request
// door. Lokaal verricht server.js dezelfde taak (zie aldaar).
//
// Zet de env-var in Vercel → Project Settings → Environment Variables:
//   ANTHROPIC_API_KEY = sk-ant-...

import { authenticate } from '../../_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  // Open voor élke ingelogde gebruiker (admin én klant). Rate-limiting
  // (500 calls per klant per dag, Europe/Amsterdam-kalenderdag) volgt
  // hieronder. Admins worden overgeslagen — die kunnen ongelimiteerd
  // aanroepen (o.a. voor de Socials generator).
  const auth = await authenticate(req);
  if (!auth.ok) return res.status(auth.status).json({ error: { message: auth.error } });

  const supaUrl = process.env.SUPABASE_URL;
  const supaSvc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const AI_DAILY_LIMIT = 500;

  // Role-lookup: alleen klanten worden gecapt. Bij een lookup-fout: fail-
  // open (call door zonder cap). Beter dan een klant onterecht blokkeren
  // bij een Supabase-hiccup — de kosten-cap is een vangnet, geen ACL.
  let isAdmin = false;
  if (supaUrl && supaSvc) {
    try {
      const rres = await fetch(`${supaUrl}/rest/v1/profiles?id=eq.${auth.user.id}&select=role`, {
        headers: { apikey: supaSvc, Authorization: `Bearer ${supaSvc}` }
      });
      if (rres.ok) {
        const rows = await rres.json();
        const role = Array.isArray(rows) && rows[0] ? rows[0].role : null;
        isAdmin = (role === 'admin' || role === 'admin_user');
      }
    } catch (_) { /* fail-open */ }
  }

  if (!isAdmin && supaUrl && supaSvc) {
    // "Vandaag" in Europe/Amsterdam. sv-SE formatter → YYYY-MM-DD (ISO).
    const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(new Date());
    try {
      const rpcRes = await fetch(`${supaUrl}/rest/v1/rpc/increment_ai_usage`, {
        method: 'POST',
        headers: {
          apikey: supaSvc,
          Authorization: `Bearer ${supaSvc}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ p_user_id: auth.user.id, p_date: today, p_limit: AI_DAILY_LIMIT })
      });
      if (rpcRes.ok) {
        const newCount = await rpcRes.json();
        if (newCount === -1) {
          return res.status(429).json({
            error: {
              type: 'rate_limit',
              message: `Je hebt vandaag je AI-limiet bereikt (${AI_DAILY_LIMIT} gebruik-momenten per dag). Morgen weer beschikbaar.`
            }
          });
        }
      } else {
        // Fail-open op infra-fout: log en laat de call door.
        console.warn('[ai-limit] increment RPC faalde:', rpcRes.status);
      }
    } catch (err) {
      console.warn('[ai-limit] increment exception:', err && err.message);
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: {
        type: 'config_error',
        message: 'ANTHROPIC_API_KEY ontbreekt — zet hem in Vercel env-vars en redeploy.'
      }
    });
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
    });

    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', 'application/json');
    return res.send(text);
  } catch (err) {
    return res.status(502).json({
      error: {
        type: 'proxy_error',
        message: (err && err.message) || 'Upstream call failed',
      }
    });
  }
}
