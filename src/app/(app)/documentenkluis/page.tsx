import { redirect } from 'next/navigation'

import { DocumentVaultSections, getUserDocuments } from '@features/documents'
import {
  firstAllowedCustomerPage,
  getAllowedCustomerPages,
} from '@features/subscriptions/lib/customerAccess'
import { hasActiveSubscription } from '@features/subscriptions/lib/hasActiveSubscription'
import { getSubscription } from '@features/subscriptions/queries'
import { requireSession } from '@shared/auth/session'

export default async function DocumentenkluisPage() {
  const session = await requireSession()
  const userId = session.user.id

  const subscription = await getSubscription(userId)
  if (!hasActiveSubscription(subscription)) {
    redirect(firstAllowedCustomerPage(getAllowedCustomerPages(subscription)))
  }

  const [adminDocuments, selfGeneratedDocuments] = await Promise.all([
    getUserDocuments(userId, 'admin'),
    getUserDocuments(userId, 'self-generated'),
  ])

  return (
    <main className="main">
      <div className="page-header">
        <div>
          <h1 className="page-title">Documentenkluis</h1>
        </div>
      </div>

      <DocumentVaultSections
        adminDocuments={adminDocuments}
        selfGeneratedDocuments={selfGeneratedDocuments}
      />
    </main>
  )
}
