import { type z } from 'zod'

import { type AnthropicMessagesResponseSchema } from '../schema'

// Joins the Anthropic response content[].text parts (osago-bundle.js:16246-16248).
export const extractAnthropicText = (
  response: z.infer<typeof AnthropicMessagesResponseSchema>,
): string =>
  response.content
    .map(block => block.text ?? '')
    .join('')
    .trim()
