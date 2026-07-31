import { type FC, type ReactNode } from 'react'

import { requireSession } from '@shared/auth/session'

import { getIdentityStatus } from '../../queries'
import { IdentityRequiredModal } from '../IdentityRequiredModal'

interface Props {
  children: ReactNode
}

// Server component: fetches the current user's identity status and, if
// unverified, renders the blocking modal instead of the children (docx §5
// "safety net": clicking a direct link to Kopermatching or Verkoopproces
// while unverified shows the verification modal, not the page).
export const IdentityGuard: FC<Props> = async ({ children }) => {
  const session = await requireSession()
  const identity = await getIdentityStatus(session.user.id)
  if (identity.status === 'verified') return <>{children}</>
  return <IdentityRequiredModal />
}
