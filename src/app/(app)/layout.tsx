import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { type ReactNode } from 'react'

import { getCompany } from '@features/company/queries'
import { ImpersonationBanner } from '@features/impersonation'
import { CustomerAccessGuard, Sidebar } from '@features/navigation'
import { WELKOM_PATHS } from '@features/onboarding'
import { ACCOUNT_PATH } from '@features/subscriptions/constants'
import {
  firstAllowedCustomerPage,
  getAllowedCustomerPages,
  isCustomerPageAllowed,
  lockPermitsPath,
} from '@features/subscriptions/lib/customerAccess'
import { lockStatus } from '@features/subscriptions/lib/lockStatus'
import {
  getOwnInvoices,
  getSubscription,
} from '@features/subscriptions/queries'
import { type LockReason } from '@features/subscriptions/types'
import { requireSession } from '@shared/auth/session'
import { QueryProvider } from '@shared/components/QueryProvider'
import { PATHNAME_HEADER } from '@shared/constants/headers'
import { cn } from '@shared/utils/cn'

interface Props {
  children: ReactNode
}

export default async function AppLayout({ children }: Props) {
  const session = await requireSession()

  // An impersonating Osago employee (session.impersonatedBy set) bypasses the
  // onboarding trigger, the overdue/expired hard-lock, and plan-visibility, and
  // sees the medewerker-only nav — legacy enterCustomerApp/applyCustomerPlan-
  // Visibility/navigate (osago-bundle.js:2822-2850, 2905-2932, 3015, 11632).
  const isMedewerker = Boolean(session.impersonatedBy)

  if (!session.onboardingSeen && !isMedewerker) {
    const company = await getCompany(session.user.id)

    if (!company?.sector) {
      redirect(WELKOM_PATHS[0])
    }
  }

  const pathname = (await headers()).get(PATHNAME_HEADER) ?? ''

  // Customer access model — ports legacy's navigate() gate + applyOverdueLock +
  // applyCustomerPlanVisibility (osago-bundle.js:3010-3042, 11642, 2906-2932).
  // Enforced here for hard loads; the CustomerAccessGuard re-enforces on
  // client-side navigation (a shared layout is not re-run across <Link> nav).
  let lockReason: LockReason = null
  let allowedPaths: string[] | null = null

  if (session.role === 'customer' && !isMedewerker) {
    const [subscription, invoices] = await Promise.all([
      getSubscription(session.user.id),
      getOwnInvoices(),
    ])

    lockReason = lockStatus(subscription, invoices)
    allowedPaths = getAllowedCustomerPages(subscription)

    if (lockReason) {
      if (!lockPermitsPath(lockReason, pathname)) {
        redirect(ACCOUNT_PATH)
      }
    } else if (!isCustomerPageAllowed(pathname, allowedPaths)) {
      redirect(firstAllowedCustomerPage(allowedPaths))
    }
  }

  const impersonatedName =
    [session.firstName, session.lastName].filter(Boolean).join(' ') ||
    (session.user.email ?? 'Klant')

  return (
    <QueryProvider>
      {isMedewerker && (
        <ImpersonationBanner
          customerEmail={session.user.email ?? null}
          customerName={impersonatedName}
        />
      )}
      <div className={cn('app active', lockReason && 'customer-locked')}>
        <Sidebar
          allowedPaths={allowedPaths}
          email={session.user.email ?? ''}
          firstName={session.firstName}
          isMedewerker={isMedewerker}
          lastName={session.lastName}
          photo={session.photo}
        />
        {session.role === 'customer' && !isMedewerker && (
          <CustomerAccessGuard
            allowedPaths={allowedPaths}
            lockReason={lockReason}
          />
        )}
        {children}
      </div>
    </QueryProvider>
  )
}
