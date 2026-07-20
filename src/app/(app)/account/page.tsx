import Link from 'next/link'

import {
  AccountPasswordForm,
  AccountPersonalInfoForm,
  AccountPhotoUpload,
} from '@features/auth'
import { getAccountProfile } from '@features/auth/queries'
import { WELKOM_PATHS } from '@features/onboarding'
import {
  AccountBlockedBanner,
  AccountInvoicesTable,
  AccountSubscriptionCard,
} from '@features/subscriptions'
import { reconcileSalesInvoiceActivations } from '@features/subscriptions/actions'
import { lockStatus } from '@features/subscriptions/lib/lockStatus'
import {
  getOwnInvoices,
  getSubscription,
} from '@features/subscriptions/queries'
import { requireSession } from '@shared/auth/session'

export default async function AccountPage() {
  const session = await requireSession()

  await reconcileSalesInvoiceActivations()

  const [subscription, invoices, profile] = await Promise.all([
    getSubscription(session.user.id),
    getOwnInvoices(),
    getAccountProfile(session.user.id),
  ])

  if (!profile) {
    throw new Error('Accountprofiel niet gevonden.')
  }

  const lockReason = lockStatus(subscription, invoices)

  return (
    <main className="main">
      <div className="page-header">
        <h1 className="page-title">Mijn account</h1>
        {session.role === 'customer' && (
          <div className="page-actions">
            <Link
              className="btn btn-secondary"
              href={WELKOM_PATHS[0]}
              title="Doorloop opnieuw de stappen om jouw bedrijfsprofiel en financiën te controleren"
            >
              <svg
                fill="none"
                height="14"
                stroke="currentColor"
                strokeWidth="2"
                style={{ marginRight: 4, verticalAlign: -2 }}
                viewBox="0 0 24 24"
                width="14"
              >
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              Onboarding starten
            </Link>
          </div>
        )}
      </div>

      <AccountPhotoUpload
        createdAt={profile.createdAt}
        email={profile.email}
        firstName={profile.firstName}
        lastName={profile.lastName}
        photo={profile.photo}
        role={session.role}
      />
      <AccountPersonalInfoForm profile={profile} />
      <AccountPasswordForm email={profile.email} />

      <AccountBlockedBanner
        invoices={invoices}
        lockReason={lockReason}
        subscription={subscription}
      />
      <AccountSubscriptionCard subscription={subscription} />
      <AccountInvoicesTable invoices={invoices} />
    </main>
  )
}
