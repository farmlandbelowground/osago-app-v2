import { AdminVouchersTable } from '@features/subscriptions'
import { adminListVouchers } from '@features/subscriptions/queries'
import { requireRole } from '@shared/auth/guards'

export default async function AdminVouchersPage() {
  await requireRole('admin')

  const vouchers = await adminListVouchers()

  return (
    <main className="main">
      <AdminVouchersTable vouchers={vouchers} />
    </main>
  )
}
