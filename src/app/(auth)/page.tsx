import { type Metadata } from 'next'
import { redirect } from 'next/navigation'

import { DASHBOARD_PATH, LoginForm } from '@features/auth'
import { getSession } from '@shared/auth/session'

export const metadata: Metadata = {
  title: 'Inloggen',
}

export default async function LoginPage() {
  const session = await getSession()

  if (session) {
    redirect(DASHBOARD_PATH)
  }

  return <LoginForm />
}
