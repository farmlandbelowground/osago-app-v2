import { type ReactNode } from 'react'

import { Sidebar } from '@features/navigation'
import { requireSession } from '@shared/auth/session'
import { QueryProvider } from '@shared/components/QueryProvider'

interface Props {
  children: ReactNode
}

export default async function AppLayout({ children }: Props) {
  const session = await requireSession()

  return (
    <QueryProvider>
      <div className="min-h-screen">
        <Sidebar
          email={session.user.email ?? ''}
          firstName={session.firstName}
          lastName={session.lastName}
        />
        <div className={`
          ml-(--sidebar-width) min-h-screen min-w-0
          max-[900px]:ml-0
        `}>
          {children}
        </div>
      </div>
    </QueryProvider>
  )
}
