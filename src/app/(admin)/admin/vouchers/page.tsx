import { AdminVouchersTable } from '@features/subscriptions'
import { adminListVouchers } from '@features/subscriptions/queries'
import { requireRole } from '@shared/auth/guards'

export default async function AdminVouchersPage() {
  await requireRole('admin')

  const vouchers = await adminListVouchers()

  return (
    <main
      className={`
        w-full px-10 py-8
        max-[900px]:p-5
      `}
    >
      <AdminVouchersTable vouchers={vouchers} />
    </main>
  )
}
