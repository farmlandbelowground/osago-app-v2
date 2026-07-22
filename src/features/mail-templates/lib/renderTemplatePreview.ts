import { LOGO_DATA_URL } from '@shared/constants/logo'

import { DEFAULT_FROM_EMAIL, DEFAULT_FROM_NAME } from '../constants'
import { type EmailTemplate } from '../schema'

interface SkeletonInput {
  bodyHtml: string
  fromName: string
  subject: string
}

export interface EmailPreview {
  bcc: string | null
  fromEmail: string
  fromName: string
  html: string
  subject: string
  text: string
}

const HTML_ESCAPES: Record<string, string> = {
  '"': '&quot;',
  '&': '&amp;',
  "'": '&#39;',
  '<': '&lt;',
  '>': '&gt;',
}

// Ports legacy `escape` (osago-bundle.js:3155).
const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, char => HTML_ESCAPES[char] ?? char)

// Ports renderEmailTemplate (osago-bundle.js:27104): {{var}} substitution,
// leaving unresolved placeholders untouched.
export const renderTemplateVars = (
  text: string,
  vars: Record<string, string>,
): string => {
  if (!text) {
    return ''
  }

  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? vars[name] : match,
  )
}

// Ports plainTextToEmailHtml (osago-bundle.js:27137): blank lines → <p>, single
// newlines → <br>, escape, autolink URLs.
export const plainTextToEmailHtml = (text: string): string => {
  if (!text) {
    return ''
  }

  return text
    .split(/\n\s*\n/)
    .map(paragraph => {
      const safe = escapeHtml(paragraph).replace(/\n/g, '<br>')
      const linked = safe.replace(
        /(https?:\/\/[^\s<]+)/g,
        '<a href="$1" style="color:#00B33C;text-decoration:underline">$1</a>',
      )

      return `<p style="margin:0 0 16px 0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#0A1F14">${linked}</p>`
    })
    .join('')
}

// Ports buildEmailSkeleton (osago-bundle.js:27153) verbatim — table-based 600px
// email shell with the Osago logo header + fixed footer.
export const buildEmailSkeleton = ({
  bodyHtml,
  fromName,
  subject,
}: SkeletonInput): string => `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#F4F4F2;font-family:Helvetica,Arial,sans-serif">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F4F4F2">
  <tr>
    <td align="center" style="padding:32px 16px">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:12px;box-shadow:0 1px 3px rgba(10,31,20,0.06)">
        <tr>
          <td style="padding:32px 40px 24px;border-bottom:1px solid #ECECE8">
            <img src="${LOGO_DATA_URL}" alt="Osago" width="120" height="auto" style="display:block;height:auto;max-width:120px" />
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px 32px;border-top:1px solid #ECECE8;background:#FAFBFA;border-radius:0 0 12px 12px">
            <p style="margin:0 0 6px 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.55;color:#6B7872">
              ${escapeHtml(fromName || DEFAULT_FROM_NAME)} · Dorpstraat 105 · 4661 HN Halsteren
            </p>
            <p style="margin:0 0 6px 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.55;color:#6B7872">
              085-0292894 · <a href="mailto:support@osago.nl" style="color:#6B7872;text-decoration:underline">support@osago.nl</a> · <a href="https://www.osago.nl" style="color:#6B7872;text-decoration:underline">osago.nl</a>
            </p>
            <p style="margin:12px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:1.55;color:#9AA59E">
              Deze e-mail is verzonden vanuit het Osago-platform. Heeft u deze e-mail per ongeluk ontvangen? Neem contact met ons op via support@osago.nl.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`

// Ports renderEmailForSending (osago-bundle.js:27203).
export const renderEmailForSending = (
  template: EmailTemplate,
  vars: Record<string, string>,
): EmailPreview => {
  const fromName = template.fromName || DEFAULT_FROM_NAME
  const fromEmail = template.fromEmail || DEFAULT_FROM_EMAIL
  const bcc =
    typeof template.bcc === 'string' && template.bcc.trim()
      ? template.bcc.trim()
      : null
  const subject = renderTemplateVars(template.subject, vars)
  const text = renderTemplateVars(template.body, vars)
  const bodyHtml = plainTextToEmailHtml(text)
  const html = buildEmailSkeleton({ bodyHtml, fromName, subject })

  return { bcc, fromEmail, fromName, html, subject, text }
}
