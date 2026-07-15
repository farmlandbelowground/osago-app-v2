// Vercel Serverless Function — start a Twilio Verify SMS 2FA challenge.
// Frontend POSTs here direct nadat Supabase het wachtwoord heeft goedgekeurd.
// We halen het telefoonnummer op uit public.profiles, sturen dat naar Twilio
// Verify, en geven een gemaskeerd nummer terug voor de UI ("SMS naar +31 6
// ****1234").
//
// Verwachte env-vars in Vercel:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (voor profile-lookup)
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID
//   TWO_FA_SIMULATOR = "1"  (optioneel — skipt de Twilio-call en geeft een
//                             vaste testcode terug voor lokale dev/staging)

import { authenticate } from '../_auth.js';

// Beperk telefoonnummer tot E.164-achtige input voordat we 't naar Twilio
// doorsturen. Niet zaligmakend (Twilio doet de echte validatie), maar filtert
// obvious rommel weg zodat we niet nodeloos SMS-quota verstoken.
function normalizePhone(raw){
  if(typeof raw !== 'string') return null;
  // Alleen cijfers en optionele leading +. Spaties, streepjes, haakjes weg.
  const trimmed = raw.replace(/[\s\-()]/g, '').trim();
  if(!/^\+?\d{6,15}$/.test(trimmed)) return null;
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
}

function maskPhone(e164){
  // "+31612345678" → "+31 6 ****5678" — voldoende hint voor de gebruiker
  // om te herkennen dat 't hun nummer is, zonder de hele reeks in de UI.
  if(typeof e164 !== 'string' || e164.length < 6) return '';
  const last4 = e164.slice(-4);
  const prefix = e164.slice(0, e164.length - 8);
  return `${prefix} ****${last4}`;
}

export default async function handler(req, res){
  if(req.method !== 'POST'){
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await authenticate(req);
  if(!auth.ok) return res.status(auth.status).json({ error: auth.error });
  const userId = auth.user.id;

  // Profile ophalen — telefoonnummer + naam voor eventuele UX-hints later.
  const url = process.env.SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let profile;
  try {
    const pres = await fetch(
      `${url}/rest/v1/profiles?id=eq.${userId}&select=phone,first_name`,
      { headers: { apikey: svc, Authorization: `Bearer ${svc}` } }
    );
    const rows = await pres.json();
    profile = Array.isArray(rows) ? rows[0] : null;
  } catch(err){
    return res.status(502).json({ error: 'Kon profiel niet ophalen.' });
  }
  if(!profile) return res.status(404).json({ error: 'Profiel niet gevonden.' });

  const phone = normalizePhone(profile.phone);
  if(!phone){
    // Bestaande klant zonder (geldig) telefoonnummer — frontend triggert dan
    // de phone-required-view en vraagt het nummer alsnog op.
    return res.status(400).json({ ok: false, error: 'phone_missing' });
  }

  // Simulator-modus voor lokale dev: geen echte SMS, vaste code die de
  // verify-endpoint ook accepteert.
  if(process.env.TWO_FA_SIMULATOR === '1'){
    return res.status(200).json({
      ok: true, simulated: true, code: '123456', phoneMasked: maskPhone(phone)
    });
  }

  // Twilio Verify — sende een SMS met code. Basic auth met Account SID
  // + Auth Token; het endpoint verwacht x-www-form-urlencoded.
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if(!accountSid || !authToken || !serviceSid){
    return res.status(500).json({ error: 'Twilio server-config ontbreekt.' });
  }
  const basic = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const body = new URLSearchParams({ To: phone, Channel: 'sms' }).toString();
  try {
    const tres = await fetch(
      `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basic}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body
      }
    );
    const data = await tres.json().catch(() => ({}));
    if(!tres.ok){
      // Twilio geeft "code" + "message" bij fouten (bv. 60200 = invalid parameter,
      // 60203 = max send attempts reached). We loggen server-side maar geven
      // een generieke fout terug aan de client.
      console.warn('[2fa/send] Twilio-fout:', tres.status, data);
      return res.status(502).json({ error: 'Verzenden van de SMS-code mislukt.' });
    }
    return res.status(200).json({ ok: true, phoneMasked: maskPhone(phone) });
  } catch(err){
    return res.status(502).json({ error: (err && err.message) || 'Twilio-call mislukt.' });
  }
}
