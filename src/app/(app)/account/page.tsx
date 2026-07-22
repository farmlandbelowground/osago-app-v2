import Link from 'next/link'
import { type ReactNode } from 'react'

import { MyAppointmentsSection } from '@features/appointments'
import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  CTA_LABEL_PROEFADVIES,
  CTA_LABEL_VOORTGANG,
  CTA_SLUG_PROEFADVIES,
  CTA_SLUG_VOORTGANG,
} from '@features/appointments/constants'
import {
  getActiveTypeBySlug,
  getMyBookings,
  getSlotsForType,
} from '@features/appointments/queries'
import { type BookingPrefill } from '@features/appointments/types'
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
import { subStatus } from '@features/subscriptions/lib/subStatus'
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

  let appointmentsSection: ReactNode = null
  if (session.role === 'customer') {
    const hasActiveSub = ACTIVE_SUBSCRIPTION_STATUSES.includes(
      subStatus(subscription).status,
    )
    const ctaSlug = hasActiveSub ? CTA_SLUG_VOORTGANG : CTA_SLUG_PROEFADVIES
    const ctaLabel = hasActiveSub ? CTA_LABEL_VOORTGANG : CTA_LABEL_PROEFADVIES

    const [appointments, ctaType] = await Promise.all([
      getMyBookings(),
      getActiveTypeBySlug(ctaSlug),
    ])
    const ctaSlots = ctaType ? await getSlotsForType(ctaType) : []
    const prefill: BookingPrefill = {
      email: profile.email,
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      phone: profile.phone ?? '',
      userId: session.user.id,
    }

    appointmentsSection = (
      <MyAppointmentsSection
        appointments={appointments}
        ctaLabel={ctaLabel}
        ctaSlots={ctaSlots}
        ctaType={ctaType}
        prefill={prefill}
      />
    )
  }

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
      {appointmentsSection}
    </main>
  )
}
