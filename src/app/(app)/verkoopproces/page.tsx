import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getCompany } from '@features/company/queries'
import {
  KOPERMATCHING_PATH,
  PipelineBoard,
  PipelineEmptyState,
  getPipelineLeads,
} from '@features/leads'
import {
  firstAllowedCustomerPage,
  getAllowedCustomerPages,
} from '@features/subscriptions/lib/customerAccess'
import { hasWerkruimteAccess } from '@features/subscriptions/lib/hasWerkruimteAccess'
import { getSubscription } from '@features/subscriptions/queries'
import { requireSession } from '@shared/auth/session'

export default async function VerkoopprocesPage() {
  const session = await requireSession()
  const userId = session.user.id

  const subscription = await getSubscription(userId)
  if (!hasWerkruimteAccess(subscription)) {
    redirect(firstAllowedCustomerPage(getAllowedCustomerPages(subscription)))
  }

  const [leads, company] = await Promise.all([
    getPipelineLeads(userId),
    getCompany(userId),
  ])

  return (
    <main className="main">
      <div className="page-header">
        <div>
          <h1 className="page-title">Verkoopproces</h1>
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href={KOPERMATCHING_PATH}>
            + Koper toevoegen vanuit matching
          </Link>
        </div>
      </div>

      {leads.length === 0 ? (
        <PipelineEmptyState />
      ) : (
        <PipelineBoard companyHasName={!!company?.name} leads={leads} />
      )}
    </main>
  )
}
