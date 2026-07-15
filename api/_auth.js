// Shared server-side auth check for the serverless API endpoints.
// Verifies the caller's Supabase session (the bearer token the browser sends)
// using the service-role key, and optionally requires an admin role.
//
// Usage in an endpoint:
//   import { authenticate } from '../_auth.js';        // adjust depth per folder
//   const auth = await authenticate(req, { requireAdmin: true });
//   if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
//   // auth.user / auth.role are available here
//
// Closes the "open to anyone on the internet" hole: without a valid login the
// request is rejected before we ever call the upstream (Resend/Anthropic/etc.).

export async function authenticate(req, { requireAdmin = false } = {}) {
  const url = process.env.SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !svc) {
    return { ok: false, status: 500, error: 'Supabase server-config ontbreekt.' };
  }

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return { ok: false, status: 401, error: 'Niet ingelogd.' };

  // Verify the token by resolving the user via GoTrue.
  let user;
  try {
    const ures = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: svc, Authorization: `Bearer ${token}` }
    });
    if (!ures.ok) return { ok: false, status: 401, error: 'Ongeldige of verlopen sessie.' };
    user = await ures.json();
  } catch (e) {
    return { ok: false, status: 502, error: 'Kon sessie niet verifiëren.' };
  }
  if (!user || !user.id) return { ok: false, status: 401, error: 'Kon gebruiker niet bepalen.' };

  if (requireAdmin) {
    try {
      const pres = await fetch(
        `${url}/rest/v1/profiles?id=eq.${user.id}&select=role`,
        { headers: { apikey: svc, Authorization: `Bearer ${svc}` } }
      );
      const rows = await pres.json();
      const role = Array.isArray(rows) && rows[0] ? rows[0].role : null;
      if (role !== 'admin' && role !== 'admin_user') {
        return { ok: false, status: 403, error: 'Alleen beheerders.' };
      }
      return { ok: true, user, role };
    } catch (e) {
      return { ok: false, status: 502, error: 'Kon rol niet verifiëren.' };
    }
  }

  return { ok: true, user };
}
