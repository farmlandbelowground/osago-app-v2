// Vercel Serverless Function — vul een ontbrekend telefoonnummer aan op het
// eigen profile. Wordt aangeroepen vanuit de "phone-required"-view in de
// login-flow voor bestaande klanten die zich vóór de SMS-2FA-eis hebben
// geregistreerd.
//
// Auth: Supabase session-token verplicht. We accepteren alleen updates op
// het profile van de authenticated user (id = auth.user.id) — nooit op een
// ander id.

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
  const phoneRaw = body && typeof body.phone === 'string' ? body.phone : '';
  const phone = normalizePhone(phoneRaw);
  if(!phone){
    return res.status(400).json({ ok: false, error: 'invalid_phone_format' });
  }

  const url = process.env.SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url || !svc){
    return res.status(500).json({ error: 'Supabase server-config ontbreekt.' });
  }
  try {
    const pres = await fetch(`${url}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        apikey: svc,
        Authorization: `Bearer ${svc}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ phone })
    });
    if(!pres.ok){
      const errText = await pres.text().catch(() => '');
      console.warn('[2fa/update-phone] profiles-update mislukt:', pres.status, errText);
      return res.status(502).json({ error: 'Kon telefoonnummer niet opslaan.' });
    }
    return res.status(200).json({ ok: true, phone });
  } catch(err){
    return res.status(502).json({ error: (err && err.message) || 'Update mislukt.' });
  }
}
