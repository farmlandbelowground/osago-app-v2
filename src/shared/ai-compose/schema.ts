import { z } from 'zod'

// frozen `api/anthropic/v1/messages` contract — read only what we use.
export const AnthropicMessagesResponseSchema = z.object({
  content: z.array(z.object({ text: z.string().optional() })),
})

export const AnthropicErrorSchema = z.object({
  error: z.object({ type: z.string().optional(), message: z.string() }),
})
