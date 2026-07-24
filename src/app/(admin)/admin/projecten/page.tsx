import { type Metadata } from 'next'

import { AdminProjectsGrid, getAdminProjects } from '@features/admin-customers'
import { requireRole } from '@shared/auth/guards'

export const metadata: Metadata = {
  title: 'Projecten',
}

export default async function AdminProjectenPage() {
  await requireRole('admin_user')

  const projects = await getAdminProjects()

  return (
    <main className="main">
      <AdminProjectsGrid projects={projects} />
    </main>
  )
}
