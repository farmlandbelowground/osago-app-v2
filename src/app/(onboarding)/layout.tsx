import { redirect } from 'next/navigation'
import { type ReactNode } from 'react'

import { ACCOUNT_PATH } from '@features/subscriptions/constants'
import { lockStatus } from '@features/subscriptions/lib/lockStatus'
import {
  getOwnInvoices,
  getSubscription,
} from '@features/subscriptions/queries'
import { requireSession } from '@shared/auth/session'
import { QueryProvider } from '@shared/components/QueryProvider'

interface Props {
  children: ReactNode
}

export default async function OnboardingLayout({ children }: Props) {
  const session = await requireSession()

  const [subscription, invoices] = await Promise.all([
    getSubscription(session.user.id),
    getOwnInvoices(),
  ])

  if (lockStatus(subscription, invoices)) {
    redirect(ACCOUNT_PATH)
  }

  return <QueryProvider>{children}</QueryProvider>
}
