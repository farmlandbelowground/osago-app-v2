// Vercel Serverless Function — admin-only aanmaken van een medewerker
// (admin of admin_user) als échte Supabase Auth-gebruiker via de service-role.
//
// Waarom server-side: een medewerker moet een echt Auth-account krijgen zodat
// hij kan inloggen én een profiles-rij met de juiste rol krijgt. De client kan
// dat niet: aanmaken vereist de service-role en de rol zetten op 'admin' mag
// alleen via de insert-trigger (handle_new_user leest user_metadata.role),
// nooit via een latere UPDATE (die blokkeert prevent_role_change).
//
// Beveiliging: alleen een VOLLEDIGE admin (role='admin'), net als update-user.
//
// Vereiste env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
import { authenticate } from '../_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await authenticate(req, { requireAdmin: true });
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
  if (auth.role !== 'admin') {
    return res.status(403).json({ error: 'Alleen volledige admins mogen medewerkers aanmaken.' });
  }

  const url = process.env.SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !svc) return res.status(500).json({ error: 'Supabase server-config ontbreekt.' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  if (!body) return res.status(400).json({ error: 'Geen body ontvangen.' });

  const { email, password, firstName, lastName, phone, role } = body;
  if (!email || !/.+@.+\..+/.test(email)) return res.status(400).json({ error: 'Ongeldig e-mailadres.' });
  if (!password || String(password).length < 8) return res.status(400).json({ error: 'Wachtwoord moet minimaal 8 tekens zijn.' });
  // Alleen medewerker-rollen toestaan; 'user' uit de UI mapt naar 'admin_user'.
  const dbRole = (role === 'admin') ? 'admin' : 'admin_user';

  const svcHeaders = { apikey: svc, Authorization: `Bearer ${svc}`, 'Content-Type': 'application/json' };

  try {
    // 1) Auth-user aanmaken, meteen bevestigd. De insert-trigger maakt de
    //    profiles-rij met role uit user_metadata (admin/admin_user).
    const createRes = await fetch(`${url}/auth/v1/admin/users`, {
      method: 'POST',
      headers: svcHeaders,
      body: JSON.stringify({
        email: String(email).toLowerCase(),
        password: String(password),
        email_confirm: true,
        user_metadata: {
          first_name: firstName || '',
          last_name: lastName || '',
          phone: phone || '',
          role: dbRole
        }
      })
    });
    let data = {}; try { data = await createRes.json(); } catch {}
    if (!createRes.ok) {
      const msg = (data && (data.msg || data.error_description || data.error)) || `HTTP ${createRes.status}`;
      return res.status(createRes.status).json({ error: msg });
    }
    if (!data.id) return res.status(502).json({ error: 'Aanmaken gelukt maar geen user-id ontvangen.' });

    // 2) Namen/telefoon bijwerken (de trigger zet alleen email + role).
    await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(data.id)}`, {
      method: 'PATCH',
      headers: Object.assign({}, svcHeaders, { Prefer: 'return=minimal' }),
      body: JSON.stringify({
        first_name: firstName || null,
        last_name: lastName || null,
        phone: phone || null
      })
    });

    return res.status(200).json({ ok: true, userId: data.id, email: data.email, role: dbRole });
  } catch (e) {
    return res.status(502).json({ error: (e && e.message) || 'Aanmaken mislukt.' });
  }
}
