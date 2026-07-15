// Vercel Cron — dagelijks. Vindt subscriptions waarvan end_date over
// EXACT 30 dagen valt en stuurt de `subscription_ending`-template naar de
// klant. Idempotent via de `sent_reminders` guard (kolom in subscriptions).
//
// Voor auto-renew=true dienen deze mails als heads-up; voor auto_renew=false
// als opzeg-hint.

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

const PLAN_LABELS = {
  'basic': 'Basis',
  'plus': 'Plus',
  'premium': 'Premium',
  'valuation-basic': 'Waardebepaling Basis',
  'valuation-premium': 'Waardebepaling Premium'
};

function nlDate(iso){
  return new Date(iso).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' });
}
function isoDay(d){ return d.toISOString().slice(0, 10); }

export default async function handler(req, res){
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  if(!secret || authHeader !== `Bearer ${secret}`){
    return res.status(401).json({ error: 'Ongeldige cron-token.' });
  }

  const target = new Date();
  target.setDate(target.getDate() + 30);
  const targetIso = isoDay(target);

  const subsRes = await supabaseFetch(
    `/rest/v1/subscriptions?end_date=eq.${targetIso}&select=*`
  );
  if(!subsRes.ok) return res.status(502).json({ error: 'Kon subscriptions niet ophalen.' });
  const subs = Array.isArray(subsRes.data) ? subsRes.data : [];

  const report = { total: subs.length, sent: 0, skipped: 0, errors: [] };
  for(const sub of subs){
    try {
      // Idempotency: sla de mail-key op in `sent_reminders` (jsonb array).
      const key = `ending_${sub.end_date}`;
      const alreadySent = Array.isArray(sub.sent_reminders) && sub.sent_reminders.includes(key);
      if(alreadySent){ report.skipped++; continue; }

      const pRes = await supabaseFetch(`/rest/v1/profiles?id=eq.${sub.user_id}&select=email,first_name`);
      const profile = Array.isArray(pRes.data) ? pRes.data[0] : null;
      if(!profile || !profile.email){ report.skipped++; continue; }

      const send = await sendTemplatedMail('subscription_ending', profile.email, {
        voornaam: profile.first_name || '',
        plan_naam: PLAN_LABELS[sub.type] || sub.type,
        eind_datum: nlDate(sub.end_date),
        auto_verlengt: sub.auto_renew ? 'ja' : 'nee'
      }, {
        context: 'cron.subscription-ending',
        related: { userId: sub.user_id, endDate: sub.end_date }
      });
      if(send.ok){
        report.sent++;
        const updated = Array.isArray(sub.sent_reminders) ? [...sub.sent_reminders, key] : [key];
        await supabaseFetch(`/rest/v1/subscriptions?user_id=eq.${sub.user_id}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ sent_reminders: updated })
        }).catch(() => {});
      } else {
        report.errors.push({ user_id: sub.user_id, error: send.error || send.reason });
      }
    } catch(err){
      report.errors.push({ user_id: sub.user_id, error: String(err && err.message || err) });
    }
  }

  return res.status(200).json(report);
}
