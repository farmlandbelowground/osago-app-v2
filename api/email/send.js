// Vercel Serverless Function — Resend transactional email proxy.
// Frontend POSTet een gerenderd bericht (subject + html + text + optionele
// attachments + bcc) en wij forwarden naar Resend's REST API. Credentials
// staan server-side in env-vars (RESEND_API_KEY), NOOIT client-side.
//
// Let op: dit endpoint is bewust NIET login-gated. Publieke (uitgelogde)
// afspraak-boekingen onder /afspraak versturen hier een bevestiging aan de
// klant én een agenda-uitnodiging aan de adviseur. Een login-gate zou die
// adviseur-notificatie breken. Interim-bescherming: een ontvangers-cap tegen
// bulk-misbruik (zie hieronder). Volledige lockdown = follow-up (eigen
// booking-confirmatie-endpoint met vast template, of session/turnstile).
//
// Verwachte env-vars:
//   RESEND_API_KEY            — vereist, "re_..." token uit Resend dashboard
//   RESEND_FROM_EMAIL         — optioneel, default "support@osago.nl"
//   RESEND_FROM_NAME          — optioneel, default "Osago"
//   EMAIL_SIMULATOR = "1"     — optioneel, skipt de Resend-call en returnt
//                               { ok: true, simulated: true } — handig voor
//                               lokale dev of Preview-omgevingen zonder
//                               Resend-credits.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

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
  if(!body){ return res.status(400).json({ error: 'Ongeldige body.' }); }

  const to      = normalizeRecipients(body.to);
  const bcc     = normalizeRecipients(body.bcc);
  const subject = typeof body.subject === 'string' ? body.subject : '';
  const html    = typeof body.html    === 'string' ? body.html    : '';
  const text    = typeof body.text    === 'string' ? body.text    : '';
  if(to.length === 0){
    return res.status(400).json({ error: '"to" ontbreekt of is leeg.' });
  }
  if(!subject){
    return res.status(400).json({ error: '"subject" ontbreekt.' });
  }
  if(!html && !text){
    return res.status(400).json({ error: 'Bericht heeft geen html of text.' });
  }

  // Anti-misbruik (interim): begrens aantal ontvangers per call. Legitieme
  // transactionele mails hebben doorgaans 1 ontvanger. Dit blokkeert bulk-
  // blasten via de relay zonder de publieke afspraak-mails te breken.
  if(to.length > 5 || bcc.length > 5){
    return res.status(400).json({ error: 'Te veel ontvangers per verzoek.' });
  }

  const apiKey    = process.env.RESEND_API_KEY;
  const fromEmail = (body.fromEmail && typeof body.fromEmail === 'string')
    ? body.fromEmail
    : (process.env.RESEND_FROM_EMAIL || 'support@osago.nl');
  const fromName  = (body.fromName && typeof body.fromName === 'string')
    ? body.fromName
    : (process.env.RESEND_FROM_NAME || 'Osago');

  // Simulator-mode voor lokale dev / Preview zonder Resend-credits.
  if(process.env.EMAIL_SIMULATOR === '1'){
    console.log('[email simulator]', { from: `${fromName} <${fromEmail}>`, to, subject });
    return res.status(200).json({ ok: true, simulated: true });
  }

  if(!apiKey){
    return res.status(500).json({ error: 'RESEND_API_KEY ontbreekt op de server.' });
  }

  // Resend-payload. `from` is "Name <email>", `to`/`bcc` zijn arrays van
  // strings. Attachments krijgen `filename` + `content` (base64 zonder
  // data-URL prefix).
  const payload = {
    from: `${fromName} <${fromEmail}>`,
    to,
    subject
  };
  if(html) payload.html = html;
  if(text) payload.text = text;
  if(bcc.length) payload.bcc = bcc;

  if(Array.isArray(body.attachments) && body.attachments.length){
    payload.attachments = body.attachments.map(att => {
      let content = '';
      if(typeof att.dataUrl === 'string'){
        const idx = att.dataUrl.indexOf(',');
        content = idx >= 0 ? att.dataUrl.slice(idx + 1) : att.dataUrl;
      } else if(typeof att.content === 'string'){
        content = att.content;
      }
      return {
        filename: att.fileName || att.filename || 'bijlage',
        content
      };
    });
  }

  try {
    const upstream = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const data = await upstream.json().catch(() => ({}));
    if(!upstream.ok){
      // Resend geeft {name, message, statusCode} bij fouten.
      console.warn('[resend] send fout:', upstream.status, data);
      return res.status(upstream.status || 502).json({
        error: (data && data.message) || `HTTP ${upstream.status}`
      });
    }
    // Bij succes returnt Resend { id }. Doorgeven als providerId voor audit.
    return res.status(200).json({ ok: true, providerId: (data && data.id) || null });
  } catch(err){
    console.warn('[resend] send exception:', err);
    return res.status(502).json({
      error: (err && err.message) || 'Upstream-call naar Resend mislukt'
    });
  }
}
