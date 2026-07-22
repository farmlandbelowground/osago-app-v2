import { type ReactNode } from 'react'

import { AdminSidebar } from '@features/navigation'
import { requireRole } from '@shared/auth/guards'

interface Props {
  children: ReactNode
}

export default async function AdminLayout({ children }: Props) {
  const session = await requireRole('admin_user')

  return (
    <div className="app active">
      <AdminSidebar
        email={session.user.email ?? ''}
        firstName={session.firstName}
        lastName={session.lastName}
        photo={session.photo}
        role={session.role === 'admin' ? 'admin' : 'admin_user'}
      />
      {children}
    </div>
  )
}
