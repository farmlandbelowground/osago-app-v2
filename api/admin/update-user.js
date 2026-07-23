// Vercel Serverless Function — admin-only wijziging van e-mail en/of wachtwoord
// van een gebruiker via de Supabase Auth Admin API (service-role).
//
// Wachtwoorden en e-mailadressen leven in Supabase Auth, niet in de profiles-
// tabel. Het admin-paneel kan ze dus niet met een gewone tabel-update aanpassen;
// dat moet server-side met de service-role via GoTrue's admin/users endpoint.
//
// Beveiliging: alleen een VOLLEDIGE admin (role='admin') mag dit. We verifiëren
// de sessie + rol met de gedeelde authenticate()-helper voordat we iets doen.
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
  // Inloggegevens wijzigen is gevoelig → alleen volledige admins, geen admin_user.
  if (auth.role !== 'admin') {
    return res.status(403).json({ error: 'Alleen volledige admins mogen inloggegevens wijzigen.' });
  }

  const url = process.env.SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !svc) return res.status(500).json({ error: 'Supabase server-config ontbreekt.' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  if (!body) return res.status(400).json({ error: 'Geen body ontvangen.' });

  const { targetUserId, email, password } = body;
  if (!targetUserId) return res.status(400).json({ error: 'targetUserId ontbreekt.' });

  const patch = {};
  if (email) {
    if (!/.+@.+\..+/.test(email)) return res.status(400).json({ error: 'Ongeldig e-mailadres.' });
    patch.email = String(email).toLowerCase();
    patch.email_confirm = true; // admin-wijziging → direct bevestigd, geen confirm-mail
  }
  if (password) {
    if (String(password).length < 8) return res.status(400).json({ error: 'Wachtwoord moet minimaal 8 tekens zijn.' });
    patch.password = String(password);
  }
  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: 'Niets te wijzigen — geef email en/of password mee.' });
  }

  try {
    const r = await fetch(`${url}/auth/v1/admin/users/${encodeURIComponent(targetUserId)}`, {
      method: 'PUT',
      headers: { apikey: svc, Authorization: `Bearer ${svc}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    });
    let data = {}; try { data = await r.json(); } catch {}
    if (!r.ok) {
      return res.status(502).json({ error: (data && (data.msg || data.error_description || data.error)) || `HTTP ${r.status}` });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ error: (e && e.message) || 'Auth-call mislukt.' });
  }
}
