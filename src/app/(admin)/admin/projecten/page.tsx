import { AdminProjectsGrid, getAdminProjects } from '@features/admin-customers'
import { requireRole } from '@shared/auth/guards'

export default async function AdminProjectenPage() {
  await requireRole('admin_user')

  const projects = await getAdminProjects()

  return (
    <main className="main">
      <AdminProjectsGrid projects={projects} />
    </main>
  )
}
