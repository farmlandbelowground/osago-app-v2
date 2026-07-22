import { z } from 'zod'

// POST /api/email/send-template (frozen, public). A `skipped:true` (disabled or
// missing template) is a deliberate no-op, NOT an error — callers must not
// surface it as a failure. Real send failures return 502.
export const SendTemplateResponseSchema = z.object({
  error: z.string().optional(),
  id: z.string().optional(),
  ok: z.boolean(),
  reason: z.string().optional(),
  simulated: z.boolean().optional(),
  skipped: z.boolean().optional(),
})

export type SendTemplateResponse = z.infer<typeof SendTemplateResponseSchema>
