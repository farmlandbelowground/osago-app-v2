// Server-side e-mail helper — leest templates uit Supabase `app_config`
// (dezelfde bron als de admin-view in de bundle) en verstuurt via Resend.
// Wordt gebruikt door: password-reset, webhook-activaties (subscription /
// lead-validation), en de cron-endpoints.
//
// Verwachte env-vars:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   — voor template-lookup
//   RESEND_API_KEY                            — voor de verzending
//   RESEND_FROM_EMAIL, RESEND_FROM_NAME       — optionele fallbacks
//   EMAIL_SIMULATOR = "1"                     — skip Resend, log alleen

import { buildEmailSkeleton, plainTextToEmailHtml } from './_email_skeleton.js';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

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

// ── Template loading & rendering ───────────────────────────────────

// Cache templates 60s in-memory zodat we niet bij elke mail Supabase raken.
let _tplCache = null;
let _tplCacheAt = 0;

export async function loadTemplates(){
  const now = Date.now();
  if(_tplCache && (now - _tplCacheAt) < 60_000) return _tplCache;
  const res = await supabaseFetch(`/rest/v1/app_config?key=eq.emailTemplates&select=value`);
  if(res.ok && Array.isArray(res.data) && res.data[0] && Array.isArray(res.data[0].value)){
    _tplCache = res.data[0].value;
    _tplCacheAt = now;
    return _tplCache;
  }
  return [];
}

export async function loadTemplate(id){
  const list = await loadTemplates();
  return list.find(t => t && t.id === id) || null;
}

function fillTemplate(str, vars){
  return String(str || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name) => {
    return (vars && vars[name] != null) ? String(vars[name]) : `{{${name}}}`;
  });
}

// Render een template naar { subject, text, html, fromName, fromEmail }.
// Vars-substitutie op subject én body; body gaat door de gedeelde skeleton
// (logo, kaart, footer) — identiek aan wat de client-bundle stuurt.
export function renderTemplate(template, vars){
  const subject  = fillTemplate(template.subject, vars);
  const text     = fillTemplate(template.body, vars);
  const fromName = template.fromName || 'Osago';
  const bodyHtml = plainTextToEmailHtml(text);
  const html     = buildEmailSkeleton({ fromName, subject, bodyHtml });
  return {
    subject, text, html, fromName,
    fromEmail: template.fromEmail || 'support@osago.nl',
    bcc:       template.bcc || null
  };
}

// ── Resend-verzending ──────────────────────────────────────────────

// Retry-strategie: tot 3 pogingen, backoff 250ms → 750ms. Retry op 5xx/429
// én netwerkfouten. Permanente 4xx (behalve 429) shortcircuit direct — die
// worden door herhalen niet beter. Elke poging deelt dezelfde Idempotency-
// Key zodat een gelukte-maar-5xx-melding op poging N geen dubbele mail
// oplevert bij poging N+1 (Resend deduplicate op deze header).
async function postToResend(payload, idempotencyKey){
  const apiKey = process.env.RESEND_API_KEY;
  if(!apiKey) throw new Error('RESEND_API_KEY ontbreekt.');
  const MAX_ATTEMPTS = 3;
  const BACKOFF_MS   = [0, 250, 750];
  let lastStatus = 0;
  let lastData = null;
  let lastErr = null;
  let attempts = 0;
  for(let attempt = 0; attempt < MAX_ATTEMPTS; attempt++){
    if(BACKOFF_MS[attempt] > 0){
      await new Promise(r => setTimeout(r, BACKOFF_MS[attempt]));
    }
    attempts++;
    try {
      const res = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if(res.ok) return { ok: true, status: res.status, data, attempts };
      lastStatus = res.status;
      lastData   = data;
      if(res.status >= 400 && res.status < 500 && res.status !== 429){
        // Permanente client-fout — retry gaat 't niet oplossen.
        return { ok: false, status: res.status, data, attempts };
      }
    } catch(err){
      lastErr = err;
    }
  }
  return {
    ok: false,
    status: lastStatus,
    data: lastData || { message: lastErr ? String(lastErr.message || lastErr) : `Resend gaf ${MAX_ATTEMPTS}x geen geldig antwoord` },
    attempts
  };
}

// Persistent audit-trail — best-effort insert in public.email_log (migratie
// 0009). Faalt nooit hard: log-persistentie mag de business-flow niet breken.
// We await 'em wel: Vercel-functions kappen dangling promises af zodra de
// response is verstuurd, dus fire-and-forget zou entries verliezen.
async function logEmailAttempt(entry){
  try {
    await supabaseFetch('/rest/v1/email_log', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        template_id:         entry.templateId || null,
        subject:             entry.subject || '(geen subject)',
        from_name:           entry.fromName || 'Osago',
        from_email:          entry.fromEmail || 'support@osago.nl',
        to_addresses:        Array.isArray(entry.to) ? entry.to : (entry.to ? [entry.to] : []),
        bcc_addresses:       entry.bcc || null,
        status:              entry.status,
        skip_reason:         entry.skipReason || null,
        provider:            entry.provider || null,
        provider_message_id: entry.providerMessageId || null,
        provider_error:      entry.providerError || null,
        attempts:            entry.attempts || 0,
        context:             entry.context || null,
        related:             entry.related || {}
      })
    });
  } catch(err){
    console.warn('[email-log] insert failed:', err && err.message);
  }
}

// Idempotency-key voor Resend — voorkomt dat een retry-pad tóch een dubbele
// mail veroorzaakt. Node 18+ heeft globalThis.crypto.randomUUID beschikbaar.
function newIdempotencyKey(){
  try { return globalThis.crypto.randomUUID(); }
  catch { return `k_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`; }
}

// Waarschuw luid als EMAIL_SIMULATOR=1 in productie draait — dat betekent
// dat élke server-mail wel logt maar niks verstuurt. In dev/preview mag 't.
function warnSimulatorInProduction(){
  if(process.env.EMAIL_SIMULATOR !== '1') return;
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV;
  if(env === 'production'){
    console.error('[email] KRITIEK: EMAIL_SIMULATOR=1 staat aan in PRODUCTIE — er worden GEEN echte mails verstuurd. Zet de env-var uit in Vercel.');
  }
}

// Verstuur een gerenderd template. `to` mag een string of array zijn.
// `opts.context` = bron van de trigger ('cron.subscription-ending',
// 'webhook.mollie.subscription', 'auth.password-reset', …); komt zo terecht
// in de email_log-tabel voor filterbare audit. `opts.related` = jsonb-blob
// ({ userId, leadId, paymentId, … }) voor koppeling aan casedata.
export async function sendRendered(rendered, to, opts){
  const options = opts || {};
  const toArr = Array.isArray(to) ? to.filter(Boolean) : (to ? [to] : []);
  if(toArr.length === 0) throw new Error('to ontbreekt');

  const logBase = {
    templateId: options.templateId || null,
    subject:    rendered.subject,
    fromName:   rendered.fromName,
    fromEmail:  rendered.fromEmail,
    to:         toArr,
    bcc:        rendered.bcc ? (Array.isArray(rendered.bcc) ? rendered.bcc : [rendered.bcc]) : null,
    context:    options.context || null,
    related:    options.related || {}
  };

  if(process.env.EMAIL_SIMULATOR === '1'){
    warnSimulatorInProduction();
    console.log('[email simulator]', {
      to: toArr, subject: rendered.subject,
      from: `${rendered.fromName} <${rendered.fromEmail}>`
    });
    await logEmailAttempt({ ...logBase, status: 'simulated', provider: 'simulator' });
    return { ok: true, simulated: true };
  }

  const payload = {
    from: `${rendered.fromName || process.env.RESEND_FROM_NAME || 'Osago'} <${rendered.fromEmail || process.env.RESEND_FROM_EMAIL || 'support@osago.nl'}>`,
    to: toArr,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text
  };
  if(rendered.bcc) payload.bcc = Array.isArray(rendered.bcc) ? rendered.bcc : [rendered.bcc];
  // Attachments in Resend-shape: { filename, content }. Content is base64
  // zonder data-URL prefix — de client-proxy strippt die er al af.
  if(Array.isArray(rendered.attachments) && rendered.attachments.length){
    payload.attachments = rendered.attachments;
  }
  const send = await postToResend(payload, newIdempotencyKey());
  if(!send.ok){
    console.warn(`[email] Resend-fout (na retries): status=${send.status}`, send.data);
    const errMsg = (send.data && send.data.message) || `HTTP ${send.status}`;
    await logEmailAttempt({ ...logBase, status: 'failed', provider: 'resend', providerError: errMsg, attempts: send.attempts || 0 });
    return { ok: false, error: errMsg };
  }
  const providerMessageId = (send.data && send.data.id) ? String(send.data.id) : null;
  await logEmailAttempt({ ...logBase, status: 'sent', provider: 'resend', providerMessageId, attempts: send.attempts || 0 });
  return { ok: true, id: providerMessageId };
}

// Convenience: laadt template op id, rendert met vars, verstuurt naar to.
// Retourneert { ok, id?, error?, skipped? } — bij ontbrekend of uitgeschakeld
// template `{ ok: false, skipped: true }` zonder te falen. Silent-skips
// worden luid gelogd (error voor ontbrekend, warn voor uitgeschakeld) zodat
// een lege/gereset app_config-lijst direct in de Vercel-logs opvalt.
export async function sendTemplatedMail(templateId, to, vars, opts){
  const options = opts || {};
  const toArr = Array.isArray(to) ? to.filter(Boolean) : (to ? [to] : []);
  // Skip-entries krijgen minimale log-info — geen render is uitgevoerd.
  const skipLog = (status, skipReason, subject) => logEmailAttempt({
    templateId, subject,
    to: toArr, status, skipReason,
    context: options.context || null,
    related: options.related || {}
  });

  let template = null;
  try {
    template = await loadTemplate(templateId);
  } catch(err){
    console.error(`[email] KRITIEK: template-lookup faalde voor "${templateId}" — ${err && err.message}. Vaak = SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY env-var ontbreekt op de server.`);
    await skipLog('failed', 'template-lookup-failed', `(lookup-fail: ${templateId})`);
    return { ok: false, error: 'template-lookup-failed' };
  }
  if(!template){
    console.error(`[email] KRITIEK: template niet gevonden: "${templateId}" — check app_config.emailTemplates in Supabase. Bericht naar ${toArr.join(',')} wordt NIET verstuurd.`);
    await skipLog('skipped', 'template-not-found', `(niet gevonden: ${templateId})`);
    return { ok: false, skipped: true, reason: 'template-not-found' };
  }
  if(template.enabled === false){
    console.warn(`[email] template uitgeschakeld: "${templateId}" — geen mail naar ${toArr.join(',')}. Zet 'enabled: true' in de admin-UI om weer te sturen.`);
    await skipLog('skipped', 'template-disabled', template.subject || `(uit: ${templateId})`);
    return { ok: false, skipped: true, reason: 'template-disabled' };
  }
  try {
    const rendered = renderTemplate(template, vars || {});
    // Optionele bcc/attachments-override — het templated-endpoint (client-side
    // triggers zoals booking-bevestiging + adviseur-uitnodiging) reikt deze
    // aan. Overschrijft eventuele template.bcc bewust: caller heeft de
    // meer specifieke informatie.
    if(options.bcc) rendered.bcc = options.bcc;
    if(Array.isArray(options.attachments) && options.attachments.length){
      rendered.attachments = options.attachments;
    }
    return await sendRendered(rendered, to, { ...options, templateId });
  } catch(err){
    console.warn(`[email] send-exception voor ${templateId}:`, err);
    await skipLog('failed', 'render-exception', template.subject || `(exception: ${templateId})`);
    return { ok: false, error: (err && err.message) || 'send failed' };
  }
}
