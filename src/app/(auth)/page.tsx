import { type Metadata } from 'next'
import { redirect } from 'next/navigation'

import { ADMIN_ACCOUNT_PATH, DASHBOARD_PATH, LoginForm } from '@features/auth'
import { reconcileSubscriptionReturn } from '@features/subscriptions/actions'
import { getSession } from '@shared/auth/session'

export const metadata: Metadata = {
  title: 'Inloggen',
}

interface Props {
  searchParams: Promise<{ paid?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const session = await getSession()
  const { paid } = await searchParams

  if (session) {
    if (paid === '1') {
      await reconcileSubscriptionReturn()
    }

    const isAdmin = session.role === 'admin' || session.role === 'admin_user'
    redirect(isAdmin ? ADMIN_ACCOUNT_PATH : DASHBOARD_PATH)
  }

  return <LoginForm />
}
