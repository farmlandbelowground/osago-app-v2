import { type ReactNode } from 'react'

import { requireSession } from '@shared/auth/session'

interface Props {
  children: ReactNode
}

export default async function AppLayout({ children }: Props) {
  await requireSession()

  return <div className="min-h-screen">{children}</div>
}
