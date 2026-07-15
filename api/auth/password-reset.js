// Vercel Serverless Function — wachtwoord-reset via Supabase + Resend.
// Klant vult zijn e-mail in op de "Wachtwoord vergeten?"-view, wij:
//   1. Genereren via de Supabase Admin API een recovery-link
//      (POST /auth/v1/admin/generate_link, type=recovery).
//   2. Renderen ons eigen `password_reset`-template en versturen via Resend.
//   3. Retourneren ALTIJD 200 zodat we niet lekken of het adres bestaat
//      (voorkomt e-mail enumeration).
//
// Vereiste env-vars:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (Supabase Admin)
//   RESEND_API_KEY                            (Resend send)
//   APP_URL                                   (voor de reset-URL)
//   RESEND_FROM_EMAIL, RESEND_FROM_NAME       (optioneel; fallback support@osago.nl / Osago)
//
// Supabase-config: voeg <APP_URL>/reset-password toe aan
// Authentication → URL Configuration → Additional Redirect URLs, anders
// weigert Supabase de redirect en werkt de link in de mail niet.

import { buildEmailSkeleton, plainTextToEmailHtml } from '../_email_skeleton.js';
import { sendRendered } from '../_email.js';

function appBaseUrl(){
  const explicit = process.env.APP_URL;
  if(explicit && /^https?:\/\//.test(explicit)) return explicit.replace(/\/$/, '');
  const vercel = process.env.VERCEL_URL;
  if(vercel) return `https://${vercel.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
  return null;
}

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

// Vervang {{var}}-placeholders in een string. Ongeknown vars blijven staan
// (helpt bij debugging als een variabele niet is meegegeven).
function fillTemplate(str, vars){
  return String(str || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name) => {
    return (vars && vars[name] != null) ? String(vars[name]) : `{{${name}}}`;
  });
}

// Haal het `password_reset`-template uit `app_config` (single source of
// waarheid — dezelfde die de admin-UI in de bundel toont). Faalt de call
// of ontbreekt de key, dan gebruiken we een minimale fallback zodat de
// mail-flow niet stukloopt.
async function loadPasswordResetTemplate(){
  try {
    const res = await supabaseFetch(
      `/rest/v1/app_config?key=eq.emailTemplates&select=value`
    );
    if(res.ok && Array.isArray(res.data) && res.data[0] && Array.isArray(res.data[0].value)){
      const tpl = res.data[0].value.find(t => t && t.id === 'password_reset');
      if(tpl) return tpl;
    }
  } catch(err){
    console.warn('[password-reset] template-fetch fout:', err);
  }
  // Fallback — matcht de default in DEFAULT_EMAIL_TEMPLATES in de bundle.
  return {
    id: 'password_reset',
    subject: 'Stel jouw wachtwoord opnieuw in',
    body:
`Beste {{voornaam}},

We ontvingen een verzoek om jouw wachtwoord opnieuw in te stellen. Klik op onderstaande link om een nieuw wachtwoord te kiezen:

{{reset_url}}

Deze link is geldig tot {{expiry_time}}. Heb je dit verzoek niet zelf gedaan? Dan kun je deze e-mail negeren.

Met vriendelijke groet,
Het Osago team`,
    fromName: 'Osago',
    fromEmail: 'support@osago.nl'
  };
}

async function renderPasswordResetEmail(voornaam, resetUrl){
  const template = await loadPasswordResetTemplate();
  const expiryTime = new Date(Date.now() + 60 * 60 * 1000).toLocaleTimeString('nl-NL', {
    hour: '2-digit', minute: '2-digit'
  });
  const vars = {
    voornaam: voornaam || '',
    reset_url: resetUrl,
    expiry_time: expiryTime
  };
  const subject  = fillTemplate(template.subject, vars);
  const text     = fillTemplate(template.body, vars);
  const fromName = template.fromName || 'Osago';
  const bodyHtml = plainTextToEmailHtml(text);
  const html     = buildEmailSkeleton({ fromName, subject, bodyHtml });
  return {
    subject, text, html, fromName,
    fromEmail: template.fromEmail || 'support@osago.nl'
  };
}

export default async function handler(req, res){
  if(req.method !== 'POST'){
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if(typeof body === 'string'){
    try { body = JSON.parse(body); } catch { body = null; }
  }
  const email = body && typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    return res.status(400).json({ error: 'Ongeldig e-mailadres.' });
  }

  const base = appBaseUrl();
  if(!base){
    console.warn('[password-reset] APP_URL ontbreekt — kan geen redirect-URL bouwen.');
    return res.status(200).json({ ok: true });
  }
  const redirectTo = `${base}/reset-password`;

  // Vraag Supabase om een recovery-link. Als 't e-mailadres niet bestaat
  // krijgen we een 404-achtige respons — dat loggen we, maar we retourneren
  // altijd 200 aan de client om enumeration te voorkomen.
  let actionLink = null;
  try {
    const linkRes = await supabaseFetch('/auth/v1/admin/generate_link', {
      method: 'POST',
      body: JSON.stringify({
        type: 'recovery',
        email,
        options: { redirect_to: redirectTo }
      })
    });
    if(linkRes.ok){
      actionLink = linkRes.data && (
        linkRes.data.action_link ||
        (linkRes.data.properties && linkRes.data.properties.action_link)
      );
    } else {
      console.warn('[password-reset] generate_link fout:', linkRes.status, linkRes.data);
    }
  } catch(err){
    console.warn('[password-reset] generate_link exception:', err);
  }
  if(!actionLink) return res.status(200).json({ ok: true });

  // Haal voornaam op voor personalisatie (best-effort).
  let voornaam = '';
  try {
    const pres = await supabaseFetch(
      `/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=first_name`
    );
    if(pres.ok && Array.isArray(pres.data) && pres.data[0]){
      voornaam = pres.data[0].first_name || '';
    }
  } catch(_){ /* best-effort */ }

  const rendered = await renderPasswordResetEmail(voornaam, actionLink);
  try {
    // sendRendered uit _email.js — deelt de retry-loop (3x met backoff),
    // idempotency-key, EMAIL_SIMULATOR-gedrag én email_log-persistentie
    // met alle andere server-mails.
    const send = await sendRendered(rendered, email, {
      templateId: 'password_reset',
      context: 'auth.password-reset',
      related: { email }
    });
    if(!send.ok){
      console.warn('[password-reset] Resend-fout:', send.error);
    }
  } catch(err){
    console.warn('[password-reset] Resend-exception:', err);
  }

  return res.status(200).json({ ok: true });
}
