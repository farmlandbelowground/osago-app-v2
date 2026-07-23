import { AdminPartnersTable } from '@features/partners'
import {
  adminCountReferralsByPartner,
  adminListPartners,
} from '@features/partners/queries'
import { adminListVouchers } from '@features/subscriptions/queries'
import { requireRole } from '@shared/auth/guards'

export default async function AdminPartnersPage() {
  await requireRole('admin')

  const [partners, vouchers, referralCounts] = await Promise.all([
    adminListPartners(),
    adminListVouchers(),
    adminCountReferralsByPartner(),
  ])

  return (
    <main className="main">
      <AdminPartnersTable
        partners={partners}
        referralCounts={referralCounts}
        vouchers={vouchers}
      />
    </main>
  )
}
