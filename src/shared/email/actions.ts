'use server'

import { legacyApiFetch } from '@shared/api/legacyApiFetch'

import { SEND_TEMPLATE_CONTEXT, SEND_TEMPLATE_ENDPOINT } from './constants'
import { SendTemplateResponseSchema } from './schema'
import {
  type SendTemplatedEmailOptions,
  type SendTemplatedEmailResult,
} from './types'

// Ports legacy deliverTemplatedEmail's transport (osago-bundle.js:23371). The
// template is resolved + rendered server-side from app_config.emailTemplates;
// the client sends only templateId + vars. This replaces the legacy client
// helper everywhere (pipeline emails, approvals, resets, advisor/document
// notices, lead-validated). Best-effort: a send failure never throws — the
// calling mutation has already succeeded, and a missing/disabled template is a
// deliberate no-op (skipped), exactly as legacy.
export const sendTemplatedEmail = async (
  templateId: string,
  to: string | string[],
  vars: Record<string, string> = {},
  options: SendTemplatedEmailOptions = {},
): Promise<SendTemplatedEmailResult> => {
  if (!templateId || (Array.isArray(to) ? to.length === 0 : !to)) {
    return { error: 'invalid-recipient', ok: false, skipped: false }
  }

  const payload: Record<string, unknown> = {
    context: options.context ?? SEND_TEMPLATE_CONTEXT,
    related: options.related ?? {},
    templateId,
    to,
    vars,
  }

  if (options.bcc) {
    payload.bcc = options.bcc
  }
  if (options.attachments && options.attachments.length > 0) {
    payload.attachments = options.attachments.map(attachment => ({
      content: attachment.content,
      dataUrl: attachment.dataUrl,
      fileName: attachment.fileName ?? 'bijlage',
    }))
  }

  try {
    const result = await legacyApiFetch(SEND_TEMPLATE_ENDPOINT, {
      body: JSON.stringify(payload),
      method: 'POST',
      schema: SendTemplateResponseSchema,
    })

    if (result.error !== null) {
      return { error: result.error, ok: false, skipped: false }
    }

    return {
      error: result.data.error ?? null,
      ok: Boolean(result.data.ok),
      skipped: Boolean(result.data.skipped),
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'send-failed',
      ok: false,
      skipped: false,
    }
  }
}
