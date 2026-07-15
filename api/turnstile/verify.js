// Vercel Serverless Function — server-side Cloudflare Turnstile-verificatie.
// De browser solvet de Turnstile-challenge en stuurt het resulterende token
// hierheen; wij verifiëren met de secret (server-side env-var, NOOIT in de
// browser).
//
// Vervangt de eerdere Google reCAPTCHA-verify-route. Het inputcontract
// (POST { token }) is identiek gehouden zodat osago-supabase.js' fetch-call
// niet hoeft te veranderen — alleen het pad verschoof van /api/recaptcha/
// verify naar /api/turnstile/verify.
//
// Env-var nodig in Vercel → Project Settings → Environment Variables:
//   TURNSTILE_SECRET = <secret-key uit Cloudflare dashboard>
//   (Tip voor demo: gebruik Cloudflare's always-pass test-secret
//    `1x0000000000000000000000000000000AA` — die accepteert elke token.)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const token = body && body.token;
  if (!token) {
    return res.status(400).json({ success: false, error: 'token ontbreekt' });
  }

  // Gracieuze fallback: als TURNSTILE_SECRET (nog) niet in Vercel env-vars
  // staat, verifiëren we de token NIET maar laten we de aanroeper wél
  // doorgaan. Spiegelt het patroon in api/auth/signup.js zodat login,
  // register én andere bot-checks consistent gedragen tot het secret is
  // toegevoegd. Met de secret aan staat dit pad gewoon door naar de echte
  // Cloudflare-siteverify hieronder.
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) {
    console.warn('[turnstile/verify] TURNSTILE_SECRET ontbreekt in env — token niet geverifieerd. Voeg de secret toe in Vercel om bot-check te activeren.');
    return res.status(200).json({
      success: true,
      skipped: true,
      reason: 'no_secret_configured'
    });
  }

  // Optioneel: client IP doorgeven voor strengere verificatie.
  const remoteIp =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    '';

  try {
    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);
    if (remoteIp) params.append('remoteip', remoteIp);

    const upstream = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const data = await upstream.json();

    if (data.success) {
      return res.status(200).json({
        success: true,
        challenge_ts: data.challenge_ts,
        hostname: data.hostname,
        // Turnstile heeft geen score; veld leeg houden voor compat.
        score: null
      });
    }
    return res.status(200).json({
      success: false,
      error: 'Turnstile-verificatie mislukt',
      'error-codes': data['error-codes'] || []
    });
  } catch (err) {
    return res.status(502).json({
      success: false,
      error: (err && err.message) || 'Upstream-call naar Cloudflare mislukt'
    });
  }
}
