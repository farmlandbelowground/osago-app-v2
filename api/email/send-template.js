// Vercel Serverless Function — server-side render + verzending van getemplate
// mail. Client stuurt een payload van < 1KB ({ templateId, to, vars, ... });
// server rendert met de bestaande skeleton en verstuurt via de
// sendTemplatedMail-pijplijn (retries, Idempotency-Key, email_log-persistentie).
//
// Waarom? De oude flow (client-side render + POST naar /api/email/send)
// produceerde payloads > 55KB — skeleton + inline logo — waardoor fetch
// keepalive uit stond en fetches tijdens redirect/tab-close ge-abort werden
// door de browser. De meest voorkomende trigger-flows redirecten meteen na
// verzending (booking → dank-scherm, Mollie-return → hard reload, admin
// pipeline-actie → re-render). Met deze splitsing past de payload altijd in
// de keepalive-cap → survives tab-close of navigatie.
//
// Public — géén login-gate — om dezelfde reden als /api/email/send: de
// publieke booking-flow moet een adviseur-notificatie kunnen sturen zonder
// ingelogd te zijn. Anti-misbruik: ontvangers-cap (5) + template moet
// bestaan en `enabled: true` staan in app_config.

import { sendTemplatedMail } from '../_email.js';

function toArray(v){
  if(v === null || v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}
function normalizeRecipients(v){
  return toArray(v).map(x => (typeof x === 'string' ? x.trim() : x)).filter(Boolean);
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
  if(!body) return res.status(400).json({ error: 'Ongeldige body.' });

  const templateId = typeof body.templateId === 'string' ? body.templateId.trim() : '';
  if(!templateId) return res.status(400).json({ error: '"templateId" ontbreekt.' });

  const to  = normalizeRecipients(body.to);
  const bcc = normalizeRecipients(body.bcc);
  if(to.length === 0){
    return res.status(400).json({ error: '"to" ontbreekt of is leeg.' });
  }
  if(to.length > 5 || bcc.length > 5){
    return res.status(400).json({ error: 'Te veel ontvangers per verzoek.' });
  }

  const vars = (body.vars && typeof body.vars === 'object') ? body.vars : {};

  // Attachments — dataUrl of raw base64 content. Resend accepteert base64
  // zonder de "data:<mime>;base64," prefix. Cap: 5MB raw (~6.7MB base64)
  // om oneigenlijk gebruik te voorkomen.
  let attachments = null;
  if(Array.isArray(body.attachments) && body.attachments.length){
    let totalContentLen = 0;
    attachments = body.attachments.map(att => {
      let content = '';
      if(typeof att.dataUrl === 'string'){
        const idx = att.dataUrl.indexOf(',');
        content = idx >= 0 ? att.dataUrl.slice(idx + 1) : att.dataUrl;
      } else if(typeof att.content === 'string'){
        content = att.content;
      }
      totalContentLen += content.length;
      return {
        filename: att.fileName || att.filename || 'bijlage',
        content
      };
    });
    // 5MB raw → ~6.99MB base64. Cap conservatief op 7MB base64-string-lengte.
    if(totalContentLen > 7 * 1024 * 1024){
      return res.status(413).json({ error: 'Attachments zijn te groot (max ~5MB totaal).' });
    }
  }

  const related = (body.related && typeof body.related === 'object') ? body.related : {};
  const context = typeof body.context === 'string' ? body.context : 'client.deliverTemplatedEmail';

  try {
    const send = await sendTemplatedMail(templateId, to, vars, {
      context,
      related,
      bcc: bcc.length ? bcc : null,
      attachments
    });
    // 200 op ok=true én op skipped (skipped is een bewuste no-op, geen fout).
    // Alleen echte send-failures → 502 zodat de client 'em kan onderscheiden.
    const httpStatus = send.ok || send.skipped ? 200 : 502;
    return res.status(httpStatus).json(send);
  } catch(err){
    console.warn('[send-template] exception:', err);
    return res.status(502).json({ ok: false, error: (err && err.message) || 'send failed' });
  }
}
