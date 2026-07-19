import { type Metadata } from 'next'
import { redirect } from 'next/navigation'

import { DASHBOARD_PATH, LoginForm } from '@features/auth'
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

    redirect(DASHBOARD_PATH)
  }

  return <LoginForm />
}
