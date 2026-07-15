import { type Metadata } from 'next'

import { VerifyEmailForm } from '@features/auth'

export const metadata: Metadata = {
  title: 'Bevestig je e-mailadres',
}

export default function VerifyEmailPage() {
  return <VerifyEmailForm />
}
