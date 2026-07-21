import { type ApiResult } from '@shared/api/fetcher'
import { legacyApiFetch } from '@shared/api/legacyApiFetch'

import {
  AI_COMPOSE_EMPTY_RESULT_ERROR,
  ANTHROPIC_MESSAGES_ENDPOINT,
} from '../constants'
import {
  AnthropicErrorSchema,
  AnthropicMessagesResponseSchema,
} from '../schema'
import { extractAnthropicText } from './extractAnthropicText'

interface RunAiComposeInput {
  maxTokens: number
  model: string
  prompt: string
}

// Server-side helper (called from feature Server Actions): posts the assembled
// prompt to the frozen Anthropic endpoint and returns the joined text. The
// endpoint's `error.message` is surfaced verbatim so the Dutch 429 daily-limit
// copy reaches the UI (ports callAiForField's error handling, :16221-16233).
export const runAiCompose = async (
  input: RunAiComposeInput,
): Promise<ApiResult<{ text: string }>> => {
  const result = await legacyApiFetch(ANTHROPIC_MESSAGES_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({
      model: input.model,
      max_tokens: input.maxTokens,
      messages: [{ role: 'user', content: input.prompt }],
    }),
    schema: AnthropicMessagesResponseSchema,
    errorSchema: AnthropicErrorSchema,
  })

  if (result.error !== null) {
    return { data: null, error: result.error }
  }

  const text = extractAnthropicText(result.data)
  if (!text) {
    return { data: null, error: AI_COMPOSE_EMPTY_RESULT_ERROR }
  }

  return { data: { text }, error: null }
}
