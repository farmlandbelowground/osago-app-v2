import { redirect } from 'next/navigation'

import { requireSession, type AuthSession } from './session'
import { type AdminRole } from './types'

export const requireRole = async (role: AdminRole): Promise<AuthSession> => {
  const session = await requireSession()

  const isAllowed =
    role === 'admin'
      ? session.role === 'admin'
      : session.role === 'admin' || session.role === 'admin_user'

  if (!isAllowed) {
    redirect('/dashboard')
  }

  return session
}

// Gate for the medewerker-only /verkoopklaar-maken route. Legacy silently
// redirects a non-impersonated visit to the dashboard (osago-bundle.js:3474-3482);
// v2 does the same server-side.
export const requireImpersonation = async (): Promise<AuthSession> => {
  const session = await requireSession()

  if (!session.impersonatedBy) {
    redirect('/dashboard')
  }

  return session
}
