// Vercel Cron — dagelijks. Stuurt de `daily_todo_digest`-mail naar klanten
// met een actieve subscription en minstens één openstaande to-do.
//
// De todo-detectie is bewust simpel gehouden en dekt de meest voorkomende
// onvoltooide onboarding-stappen. Meer geraffineerde per-klant-todos (value
// drivers, waardering, verkooppresentatie, etc.) leven in de bundle en
// vergen een grotere server-side port — die kunnen in een follow-up.
//
// Alleen verstuurd wanneer er minimaal 1 openstaande todo is (per de template-
// specificatie: "alleen verzonden bij ten minste één openstaande taak").

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

function isoDay(d){ return d.toISOString().slice(0, 10); }
function nlLongDate(d){
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function computeTodos(company){
  const c = company || {};
  const extra = (c.extra && typeof c.extra === 'object') ? c.extra : {};
  const todos = [];
  if(!c.kvk_nummer) todos.push('Koppel Osago met de Kamer van Koophandel');
  if(!c.name || !c.sector) todos.push('Maak alle bedrijfsgegevens compleet');
  // Financials — check op de meest voorkomende extra-key of dcf_new_inputs.
  const hasFin = extra.financials || c.dcf_new_inputs;
  if(!hasFin) todos.push('Vul de financiële parameters van jouw bedrijf in');
  return todos;
}

export default async function handler(req, res){
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  if(!secret || authHeader !== `Bearer ${secret}`){
    return res.status(401).json({ error: 'Ongeldige cron-token.' });
  }

  const today = new Date();
  const todayIso = isoDay(today);

  // Alle actieve subscriptions (end_date >= vandaag).
  const subsRes = await supabaseFetch(
    `/rest/v1/subscriptions?end_date=gte.${todayIso}&select=user_id`
  );
  if(!subsRes.ok) return res.status(502).json({ error: 'Kon subscriptions niet ophalen.' });
  const userIds = (Array.isArray(subsRes.data) ? subsRes.data : [])
    .map(s => s && s.user_id).filter(Boolean);
  if(userIds.length === 0) return res.status(200).json({ total: 0, sent: 0 });

  const report = { total: userIds.length, sent: 0, skipped: 0, errors: [] };
  for(const uid of userIds){
    try {
      const [pRes, cRes] = await Promise.all([
        supabaseFetch(`/rest/v1/profiles?id=eq.${uid}&select=email,first_name,last_todo_digest_date`),
        supabaseFetch(`/rest/v1/companies?user_id=eq.${uid}&select=*`)
      ]);
      const profile = Array.isArray(pRes.data) ? pRes.data[0] : null;
      const company = Array.isArray(cRes.data) ? cRes.data[0] : null;
      if(!profile || !profile.email){ report.skipped++; continue; }

      // Idempotency-guard: bij redeploy of double-fire van de cron voorkom
      // dat één klant vandaag twee digest-mails krijgt.
      if(profile.last_todo_digest_date === todayIso){ report.skipped++; continue; }

      const todos = computeTodos(company);
      if(todos.length === 0){ report.skipped++; continue; }

      const todoLijst = todos.map(t => '• ' + t).join('\n');
      const send = await sendTemplatedMail('daily_todo_digest', profile.email, {
        voornaam: profile.first_name || '',
        datum: nlLongDate(today),
        aantal_todos: String(todos.length),
        todo_lijst: todoLijst
      }, {
        context: 'cron.daily-todo-digest',
        related: { userId: uid, todoCount: todos.length }
      });
      if(send.ok){
        report.sent++;
        // Idempotency-marker zetten. Fire-and-forget: bij een fout hier
        // hebben we wel al de mail verstuurd, dus we willen de run niet
        // stukhelpen — worst case: dubbele mail bij een volgende double-fire
        // vandaag, wat nog steeds beter is dan de send niet loggen.
        await supabaseFetch(`/rest/v1/profiles?id=eq.${uid}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ last_todo_digest_date: todayIso })
        }).catch(() => {});
      } else {
        report.errors.push({ user_id: uid, error: send.error || send.reason });
      }
    } catch(err){
      report.errors.push({ user_id: uid, error: String(err && err.message || err) });
    }
  }
  return res.status(200).json(report);
}
