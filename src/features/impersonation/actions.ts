'use server'

import { z } from 'zod'

import { legacyApiFetch } from '@shared/api/legacyApiFetch'
import { requireRole } from '@shared/auth/guards'
import {
  clearImpersonation,
  setImpersonation,
} from '@shared/auth/impersonation'

import { IMPERSONATE_ENDPOINT, IMPERSONATION_FAILED_MESSAGE } from './constants'
import { ImpersonateResponseSchema } from './schema'
import { type StartImpersonationResult } from './types'

const TargetUserIdSchema = z.string().min(1)

// Mirrors legacy loginAsCustomer's server hop (osago-bundle.js:2687-2741). The
// caller must be an admin (the frozen endpoint also 403s non-admins). The
// server-readable marker is set here, before the client performs the verifyOtp
// swap — getSession() ignores it until the session actually becomes the
// customer, so setting it early is safe and keeps the admin id server-verified.
export const startImpersonation = async (
  targetUserId: string,
): Promise<StartImpersonationResult> => {
  const parsed = TargetUserIdSchema.safeParse(targetUserId)

  if (!parsed.success) {
    return { error: IMPERSONATION_FAILED_MESSAGE, ok: false }
  }

  const session = await requireRole('admin_user')

  const result = await legacyApiFetch(IMPERSONATE_ENDPOINT, {
    body: JSON.stringify({ targetUserId: parsed.data }),
    method: 'POST',
    schema: ImpersonateResponseSchema,
  })

  if (result.error !== null) {
    return { error: IMPERSONATION_FAILED_MESSAGE, ok: false }
  }

  await setImpersonation({
    adminEmail: session.user.email ?? null,
    adminId: session.user.id,
  })

  return {
    email: result.data.email,
    ok: true,
    tokenHash: result.data.tokenHash,
    type: result.data.type,
  }
}

export const exitImpersonation = async (): Promise<void> => {
  await clearImpersonation()
}
