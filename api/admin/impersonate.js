// Vercel Serverless Function — admin impersonation ("inloggen als klant").
// Geeft de admin een ECHTE Supabase-sessie als de doel-klant, zodat auth.uid()
// daadwerkelijk de klant wordt (i.p.v. alleen een client-side schermwissel).
//
// Beveiliging:
//  - De aanvrager moet zelf een geldige sessie hebben én role admin/admin_user.
//    Dit wordt server-side gecontroleerd met de service-role key.
//  - De service-role key blijft uitsluitend server-side.
//
// Flow: client stuurt { targetUserId } + Authorization: Bearer <admin-jwt>.
//   1. Verifieer de admin-JWT (GoTrue /user) → callerId.
//   2. Controleer dat callerId role admin/admin_user heeft (profiles).
//   3. Genereer een magic-link voor de klant (admin generate_link, géén e-mail).
//   4. Retourneer { tokenHash, type } — de client wisselt hiermee van sessie
//      via supabase.auth.verifyOtp({ token_hash, type }).
//
// Vereiste env-vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = process.env.SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !svc) {
    return res.status(500).json({ error: 'Supabase server-config ontbreekt.' });
  }

  // 1. Wie vraagt dit aan? Verifieer de meegestuurde admin-JWT.
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Geen autorisatie-token.' });

  try {
    const userRes = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: svc, Authorization: `Bearer ${token}` }
    });
    if (!userRes.ok) return res.status(401).json({ error: 'Ongeldige of verlopen sessie.' });
    const caller = await userRes.json();
    const callerId = caller && caller.id;
    if (!callerId) return res.status(401).json({ error: 'Kon aanvrager niet bepalen.' });

    // 2. Is de aanvrager een beheerder?
    const profRes = await fetch(
      `${url}/rest/v1/profiles?id=eq.${callerId}&select=role`,
      { headers: { apikey: svc, Authorization: `Bearer ${svc}` } }
    );
    const profRows = await profRes.json();
    const role = Array.isArray(profRows) && profRows[0] ? profRows[0].role : null;
    if (role !== 'admin' && role !== 'admin_user') {
      return res.status(403).json({ error: 'Alleen beheerders mogen impersoneren.' });
    }

    // 3. Doel-klant ophalen.
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
    const targetUserId = body && body.targetUserId;
    if (!targetUserId) return res.status(400).json({ error: 'targetUserId ontbreekt.' });

    const targetRes = await fetch(`${url}/auth/v1/admin/users/${targetUserId}`, {
      headers: { apikey: svc, Authorization: `Bearer ${svc}` }
    });
    if (!targetRes.ok) return res.status(404).json({ error: 'Doel-gebruiker niet gevonden.' });
    const target = await targetRes.json();
    const targetEmail = target && target.email;
    if (!targetEmail) return res.status(404).json({ error: 'Doel-gebruiker heeft geen e-mail.' });

    // 4. Genereer een magic-link (verstuurt GEEN e-mail bij de admin-variant).
    const genRes = await fetch(`${url}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers: { apikey: svc, Authorization: `Bearer ${svc}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'magiclink', email: targetEmail })
    });
    const gen = await genRes.json();
    if (!genRes.ok) {
      return res.status(502).json({ error: gen.msg || gen.error_description || 'Kon impersonatie-link niet genereren.' });
    }
    const tokenHash = gen.hashed_token || (gen.properties && gen.properties.hashed_token);
    const verifyType = gen.verification_type || (gen.properties && gen.properties.verification_type) || 'magiclink';
    if (!tokenHash) return res.status(502).json({ error: 'Geen token ontvangen van Supabase.' });

    return res.status(200).json({ ok: true, tokenHash, type: verifyType, email: targetEmail });
  } catch (err) {
    return res.status(502).json({ error: (err && err.message) || 'Impersonatie mislukt.' });
  }
}
