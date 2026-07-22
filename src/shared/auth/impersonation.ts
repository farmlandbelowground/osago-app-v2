import { cookies } from 'next/headers'
import { z } from 'zod'

import { IMPERSONATION_COOKIE } from './constants'

const ImpersonationMarkerSchema = z.object({
  adminEmail: z.string().nullable(),
  adminId: z.string().min(1),
})

export type ImpersonationMarker = z.infer<typeof ImpersonationMarkerSchema>

// Server-readable impersonation marker. v2 stores the Supabase session in
// httpOnly cookies, so after verifyOtp() the session is genuinely the customer
// and nothing server-side signals an impersonation — this separate cookie is
// that signal (getSession() reads it to set AuthSession.impersonatedBy). It is
// NOT a security boundary: like legacy's sessionStorage flag it is forgeable,
// and every privileged action stays gated by RLS + the admin-app requireRole.
export const readImpersonation =
  async (): Promise<ImpersonationMarker | null> => {
    const store = await cookies()
    const raw = store.get(IMPERSONATION_COOKIE)?.value

    if (!raw) {
      return null
    }

    try {
      const parsed = ImpersonationMarkerSchema.safeParse(JSON.parse(raw))

      return parsed.success ? parsed.data : null
    } catch {
      return null
    }
  }

export const setImpersonation = async (
  marker: ImpersonationMarker,
): Promise<void> => {
  const store = await cookies()

  store.set(IMPERSONATION_COOKIE, JSON.stringify(marker), {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
  })
}

export const clearImpersonation = async (): Promise<void> => {
  const store = await cookies()
  store.delete(IMPERSONATION_COOKIE)
}
