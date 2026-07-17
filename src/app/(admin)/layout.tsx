import { type ReactNode } from 'react'

import { AdminSidebar } from '@features/navigation'
import { requireRole } from '@shared/auth/guards'

interface Props {
  children: ReactNode
}

export default async function AdminLayout({ children }: Props) {
  const session = await requireRole('admin_user')

  return (
    <div className="min-h-screen">
      <AdminSidebar
        email={session.user.email ?? ''}
        firstName={session.firstName}
        lastName={session.lastName}
        role={session.role === 'admin' ? 'admin' : 'admin_user'}
      />
      <div
        className={`
          ml-(--sidebar-width) min-h-screen min-w-0
          max-[900px]:ml-0
        `}
      >
        {children}
      </div>
    </div>
  )
}
