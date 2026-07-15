// Vercel Cron — dagelijks. Vindt klanten die 48h geleden zijn geregistreerd
// maar nog geen abonnement hebben, en stuurt de `registration_no_subscription_
// followup`-template. Idempotent via een lokale flag op profiles.

import { sendTemplatedMail } from '../_email.js';

async function supabaseFetch(path, opts = {}){
  const url = process.env.SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url || !svc) throw new Error('Supabase server-config ontbreekt.');
  const headers = Object.assign({
    apikey: svc,
    Authorization: `Bearer ${svc}`,
    'Content-Type': 'application/json'
  }, opts.headers || {});
  const res = await fetch(`${url}${path}`, { ...opts, headers });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

export default async function handler(req, res){
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  if(!secret || authHeader !== `Bearer ${secret}`){
    return res.status(401).json({ error: 'Ongeldige cron-token.' });
  }

  // Klanten die tussen 48h en 72h geleden zijn aangemaakt (1 dag window).
  const now = Date.now();
  const from = new Date(now - 72 * 3600 * 1000).toISOString();
  const to   = new Date(now - 48 * 3600 * 1000).toISOString();

  const profRes = await supabaseFetch(
    `/rest/v1/profiles?role=eq.customer&created_at=gte.${from}&created_at=lte.${to}&select=id,email,first_name,followup_no_sub_sent`
  );
  if(!profRes.ok) return res.status(502).json({ error: 'Kon profielen niet ophalen.' });
  const profiles = Array.isArray(profRes.data) ? profRes.data : [];

  const report = { total: profiles.length, sent: 0, skipped: 0, errors: [] };
  for(const profile of profiles){
    try {
      if(profile.followup_no_sub_sent){ report.skipped++; continue; }
      // Check of ze een subscription hebben.
      const subRes = await supabaseFetch(`/rest/v1/subscriptions?user_id=eq.${profile.id}&select=user_id`);
      if(Array.isArray(subRes.data) && subRes.data.length > 0){ report.skipped++; continue; }
      if(!profile.email){ report.skipped++; continue; }

      const send = await sendTemplatedMail('registration_no_subscription_followup', profile.email, {
        voornaam: profile.first_name || '',
        login_url: (process.env.APP_URL || '') + '/'
      }, {
        context: 'cron.registration-no-subscription-followup',
        related: { userId: profile.id }
      });
      if(send.ok){
        report.sent++;
        await supabaseFetch(`/rest/v1/profiles?id=eq.${profile.id}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ followup_no_sub_sent: true })
        }).catch(() => {});
      } else {
        report.errors.push({ user_id: profile.id, error: send.error || send.reason });
      }
    } catch(err){
      report.errors.push({ user_id: profile.id, error: String(err && err.message || err) });
    }
  }
  return res.status(200).json(report);
}
