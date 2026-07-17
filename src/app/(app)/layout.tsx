import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { type ReactNode } from 'react'

import { Sidebar } from '@features/navigation'
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
      <div className="min-h-screen">
        <Sidebar
          email={session.user.email ?? ''}
          firstName={session.firstName}
          lastName={session.lastName}
        />
        <div
          className={`
            ml-(--sidebar-width) min-h-screen min-w-0
            max-[900px]:ml-0
          `}
        >
          {children}
        </div>
      </div>
    </QueryProvider>
  )
}
