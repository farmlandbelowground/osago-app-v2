import { z } from 'zod'

// POST /api/admin/impersonate (frozen). The server re-checks the caller is
// admin/admin_user (service-role) and mints a magic-link for the target's
// email without sending it, returning the token hash for verifyOtp.
export const ImpersonateResponseSchema = z.object({
  email: z.email(),
  ok: z.literal(true),
  tokenHash: z.string().min(1),
  type: z.string(),
})

export type ImpersonateResponse = z.infer<typeof ImpersonateResponseSchema>
