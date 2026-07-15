// Vercel Serverless Function — controleer een Twilio Verify SMS 2FA-code.
// Frontend POSTs { code } zodra de gebruiker de 6 cijfers invult. Wij pakken
// het telefoonnummer bij de sessie-gebruiker en checken de code tegen
// Twilio Verify's VerificationCheck-endpoint. Twilio managet TTL, retry-
// limits en lockout server-side, dus wij hoeven zelf niks bij te houden.
//
// Verwachte env-vars: zie send.js. TWO_FA_SIMULATOR = "1" laat elke code
// die matcht met '123456' door voor lokale dev.

import { authenticate } from '../_auth.js';

function normalizePhone(raw){
  if(typeof raw !== 'string') return null;
  const trimmed = raw.replace(/[\s\-()]/g, '').trim();
  if(!/^\+?\d{6,15}$/.test(trimmed)) return null;
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
}

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
  const code = body && typeof body.code === 'string' ? body.code.trim() : '';
  if(!/^\d{4,10}$/.test(code)){
    return res.status(400).json({ ok: false, error: 'invalid_code_format' });
  }

  // Simulator-modus — accepteer '123456' onvoorwaardelijk zodat lokale dev
  // door de flow kan zonder Twilio-credits te verstoken.
  if(process.env.TWO_FA_SIMULATOR === '1'){
    if(code === '123456') return res.status(200).json({ ok: true, simulated: true });
    return res.status(200).json({ ok: false, error: 'invalid_code' });
  }

  // Telefoonnummer ophalen (verify.check verwacht "To" bij het endpoint).
  const url = process.env.SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let profile;
  try {
    const pres = await fetch(
      `${url}/rest/v1/profiles?id=eq.${userId}&select=phone`,
      { headers: { apikey: svc, Authorization: `Bearer ${svc}` } }
    );
    const rows = await pres.json();
    profile = Array.isArray(rows) ? rows[0] : null;
  } catch(err){
    return res.status(502).json({ error: 'Kon profiel niet ophalen.' });
  }
  if(!profile) return res.status(404).json({ error: 'Profiel niet gevonden.' });

  const phone = normalizePhone(profile.phone);
  if(!phone) return res.status(400).json({ ok: false, error: 'phone_missing' });

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if(!accountSid || !authToken || !serviceSid){
    return res.status(500).json({ error: 'Twilio server-config ontbreekt.' });
  }
  const basic = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const params = new URLSearchParams({ To: phone, Code: code }).toString();
  try {
    const tres = await fetch(
      `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basic}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      }
    );
    const data = await tres.json().catch(() => ({}));
    if(!tres.ok){
      // 404 = geen actieve verification (verlopen of nooit gestart).
      // 60202 = max check attempts reached — Twilio blokkeert dan verdere
      // pogingen op dezelfde verification. Frontend krijgt generic error.
      console.warn('[2fa/verify] Twilio-fout:', tres.status, data);
      return res.status(200).json({ ok: false, error: 'verify_failed' });
    }
    // Twilio geeft { status: 'approved' | 'pending' | 'canceled' } terug.
    if(data && data.status === 'approved'){
      return res.status(200).json({ ok: true });
    }
    return res.status(200).json({ ok: false, error: 'invalid_code' });
  } catch(err){
    return res.status(502).json({ error: (err && err.message) || 'Twilio-call mislukt.' });
  }
}
