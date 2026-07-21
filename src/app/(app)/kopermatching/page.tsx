import Link from 'next/link'
import { redirect } from 'next/navigation'

import { MIJN_BEDRIJF_PATH } from '@features/company/constants'
import { getCompany } from '@features/company/queries'
import {
  AutoLeadsPanel,
  BuyerMatchingTabs,
  ManualLeadsPanel,
  OsagoValidatedPanel,
  getCandidateLeads,
} from '@features/leads'
import {
  firstAllowedCustomerPage,
  getAllowedCustomerPages,
} from '@features/subscriptions/lib/customerAccess'
import { hasWerkruimteAccess } from '@features/subscriptions/lib/hasWerkruimteAccess'
import { getSubscription } from '@features/subscriptions/queries'
import { requireSession } from '@shared/auth/session'

export default async function KopermatchingPage() {
  const session = await requireSession()
  const userId = session.user.id

  // Plan gate — port of getAllowedCustomerPages: an ineligible customer is
  // redirected to their first allowed page (never shown a restricted page),
  // matching legacy navigate(). The layout enforces this on hard load; this
  // covers a direct client-nav RSC fetch to the route.
  const subscription = await getSubscription(userId)
  if (!hasWerkruimteAccess(subscription)) {
    redirect(firstAllowedCustomerPage(getAllowedCustomerPages(subscription)))
  }

  const company = await getCompany(userId)

  if (!company?.sector) {
    return (
      <main className="main">
        <div className="page-header">
          <div>
            <h1 className="page-title">Kopermatching</h1>
          </div>
        </div>
        <div className="card">
          <div className="empty">
            <div className="empty-icon">
              <svg
                fill="none"
                height="24"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="24"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <h3>Vul eerst jouw bedrijfsprofiel in</h3>
            <p>
              Met sector en bedrijfsgrootte kunnen we een gerichte lijst
              potentiële kopers samenstellen.
            </p>
            <Link className="btn btn-primary" href={MIJN_BEDRIJF_PATH}>
              Naar bedrijfsprofiel
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const [autoLeads, osagoLeads, manualLeads] = await Promise.all([
    getCandidateLeads(userId, 'auto_identified'),
    getCandidateLeads(userId, 'osago_validated'),
    getCandidateLeads(userId, 'manual'),
  ])

  return (
    <main className="main">
      <div className="page-header">
        <div>
          <h1 className="page-title">Kopermatching</h1>
        </div>
      </div>

      <BuyerMatchingTabs
        autoPanel={
          <AutoLeadsPanel
            city={company.city}
            leads={autoLeads}
            sector={company.sector}
          />
        }
        manualPanel={<ManualLeadsPanel leads={manualLeads} />}
        osagoPanel={<OsagoValidatedPanel leads={osagoLeads} />}
      />
    </main>
  )
}
