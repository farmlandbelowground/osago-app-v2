import {
  AccountPasswordForm,
  AccountPersonalInfoForm,
  AccountPhotoUpload,
} from '@features/auth'
import { getAccountProfile } from '@features/auth/queries'
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
    <main
      className={`
        w-full px-10 pt-8 pb-20
        max-[900px]:p-5
      `}
    >
      <div className="mb-7">
        <h1
          className={`
            font-serif text-[34px] leading-tight font-medium tracking-tight
            text-foreground
          `}
        >
          Mijn account
        </h1>
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
