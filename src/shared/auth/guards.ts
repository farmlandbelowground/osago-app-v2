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
