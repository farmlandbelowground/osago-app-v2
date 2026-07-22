import { adminListStaff, TeamGrid } from '@features/team'
import { requireRole } from '@shared/auth/guards'

export default async function AdminMedewerkerPage() {
  const session = await requireRole('admin')
  const staff = await adminListStaff()

  return (
    <main className="main">
      <TeamGrid currentUserId={session.user.id} staff={staff} />
    </main>
  )
}
