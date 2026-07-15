// Vercel Serverless Function — server-side registratie via Supabase Admin API.
// Met service-role kunnen we de gebruiker meteen confirmeren (skip email),
// wat de test-flow vereenvoudigt. Voor productie: zet dit terug naar de
// standaard supabase.auth.signUp client-flow zodat email-verificatie afdwingt.
//
// Vereiste env-vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//                    optioneel RECAPTCHA_SECRET (voor server-side bot-check).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Supabase server-config ontbreekt.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  if (!body) return res.status(400).json({ error: 'Geen body ontvangen.' });

  const { email, password, firstName, lastName, phone, company, recaptchaToken } = body;

  if (!email || !/.+@.+\..+/.test(email)) {
    return res.status(400).json({ error: 'Ongeldig e-mailadres.' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Wachtwoord moet minimaal 8 tekens zijn.' });
  }

  // Bot-check (Cloudflare Turnstile). De token is altijd verplicht; de
  // server-side verificatie gebeurt zodra TURNSTILE_SECRET in Vercel staat.
  // Zonder secret verifiëren we (nog) niet, maar breken we signup óók niet —
  // zo is deze deploy veilig en wordt de check vanzelf "echt" zodra de secret
  // wordt toegevoegd. recaptchaToken draagt de Turnstile-token (naam behouden
  // voor compat met de client-call).
  if (!recaptchaToken) {
    return res.status(400).json({ error: 'Bot-verificatie ontbreekt. Vernieuw de pagina en probeer opnieuw.' });
  }
  const turnstileSecret = process.env.TURNSTILE_SECRET;
  if (turnstileSecret) {
    try {
      const params = new URLSearchParams();
      params.append('secret', turnstileSecret);
      params.append('response', recaptchaToken);
      const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
      if (ip) params.append('remoteip', ip);
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return res.status(400).json({ error: 'Bot-verificatie mislukt. Probeer opnieuw.' });
      }
    } catch (_) {
      return res.status(502).json({ error: 'Kon bot-verificatie niet uitvoeren. Probeer opnieuw.' });
    }
  } else {
    console.warn('[signup] TURNSTILE_SECRET ontbreekt in env — token niet geverifieerd. Voeg de secret toe in Vercel.');
  }

  try {
    // Maak user aan met email_confirm:true zodat ze meteen kunnen inloggen
    // (geen verificatie-email nodig). De DB-trigger handle_new_user maakt
    // automatisch een profile-row aan met role='customer'.
    const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email.toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName || '',
          last_name: lastName || '',
          phone: phone || '',
          company: company || '',
          role: 'customer'
        }
      })
    });
    const data = await createRes.json();
    if (!createRes.ok) {
      // Duidelijke error-messages naar de frontend
      const msg = data.msg || data.error_description || data.error || 'Registratie mislukt.';
      return res.status(createRes.status).json({ error: msg });
    }

    // Update profile met first/last name (trigger zet alleen email + role)
    if (data.id) {
      await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${data.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          first_name: firstName || null,
          last_name: lastName || null,
          phone: phone || null,
          company: company || null
        })
      });
    }

    return res.status(200).json({
      ok: true,
      userId: data.id,
      email: data.email,
      message: 'Account aangemaakt — je kunt direct inloggen.'
    });
  } catch (err) {
    return res.status(502).json({
      error: (err && err.message) || 'Onverwachte fout bij registratie.'
    });
  }
}
