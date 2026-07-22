import { AdminPartnersTable } from '@features/partners'
import { adminListPartners } from '@features/partners/queries'
import { adminListVouchers } from '@features/subscriptions/queries'
import { requireRole } from '@shared/auth/guards'

export default async function AdminPartnersPage() {
  await requireRole('admin')

  const [partners, vouchers] = await Promise.all([
    adminListPartners(),
    adminListVouchers(),
  ])

  return (
    <main className="main">
      <AdminPartnersTable partners={partners} vouchers={vouchers} />
    </main>
  )
}
