'use server'

import {
  AI_MODEL_LONG,
  ANTHROPIC_MESSAGES_ENDPOINT,
} from '@shared/ai-compose/constants'
import { extractAnthropicText } from '@shared/ai-compose/lib/extractAnthropicText'
import {
  AnthropicErrorSchema,
  AnthropicMessagesResponseSchema,
} from '@shared/ai-compose/schema'
import { legacyApiFetch } from '@shared/api/legacyApiFetch'
import { requireRole } from '@shared/auth/guards'

import { SOCIALS_MAX_TOKENS } from './constants'

// One Anthropic call per platform, server-side. Legacy fired these raw from the
// browser, but v2 cannot call legacyApiFetch client-side (it resolves the
// server Supabase client), so the 3 parallel calls become 3 parallel invocations
// of this action from the client hook. Admin-only (the page is admin-gated; the
// frozen endpoint's 500/day cap never bites admins).
export const generateSocialPost = async (
  message: string,
): Promise<{ error: string | null; text: string | null }> => {
  await requireRole('admin')

  const result = await legacyApiFetch(ANTHROPIC_MESSAGES_ENDPOINT, {
    body: JSON.stringify({
      max_tokens: SOCIALS_MAX_TOKENS,
      messages: [{ content: message, role: 'user' }],
      model: AI_MODEL_LONG,
    }),
    errorSchema: AnthropicErrorSchema,
    method: 'POST',
    schema: AnthropicMessagesResponseSchema,
  })

  if (result.error !== null) {
    return { error: result.error, text: null }
  }

  return { error: null, text: extractAnthropicText(result.data) }
}
