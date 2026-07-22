import { adminListCustomers, AdminCustomersTable } from '@features/admin-customers'
import { requireRole } from '@shared/auth/guards'

export default async function AdminKlantenPage() {
  await requireRole('admin_user')

  const customers = await adminListCustomers()

  return (
    <main className="main">
      <AdminCustomersTable customers={customers} />
    </main>
  )
}
