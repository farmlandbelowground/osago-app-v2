import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { type ReactNode } from 'react'

import { getCompany } from '@features/company/queries'
import { Sidebar } from '@features/navigation'
import { WELKOM_PATHS } from '@features/onboarding'
import {
  ABONNEMENT_AFSLUITEN_PATH,
  ACCOUNT_PATH,
} from '@features/subscriptions/constants'
import { lockStatus } from '@features/subscriptions/lib/lockStatus'
import {
  getOwnInvoices,
  getSubscription,
} from '@features/subscriptions/queries'
import { requireSession } from '@shared/auth/session'
import { QueryProvider } from '@shared/components/QueryProvider'
import { PATHNAME_HEADER } from '@shared/constants/headers'

interface Props {
  children: ReactNode
}

export default async function AppLayout({ children }: Props) {
  const session = await requireSession()

  if (!session.onboardingSeen) {
    const company = await getCompany(session.user.id)

    if (!company?.sector) {
      redirect(WELKOM_PATHS[0])
    }
  }

  const pathname = (await headers()).get(PATHNAME_HEADER) ?? ''
  const isLockExempt =
    pathname === ABONNEMENT_AFSLUITEN_PATH || pathname === ACCOUNT_PATH

  if (!isLockExempt) {
    const [subscription, invoices] = await Promise.all([
      getSubscription(session.user.id),
      getOwnInvoices(),
    ])

    if (lockStatus(subscription, invoices)) {
      redirect(ACCOUNT_PATH)
    }
  }

  return (
    <QueryProvider>
      <div className="app active">
        <Sidebar
          email={session.user.email ?? ''}
          firstName={session.firstName}
          lastName={session.lastName}
        />
        {children}
      </div>
    </QueryProvider>
  )
}
