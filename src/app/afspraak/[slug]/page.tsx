import { type Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BookingFlow } from '@features/appointments'
import {
  getActiveTypeBySlug,
  getSlotsForType,
} from '@features/appointments/queries'
import { type BookingPrefill } from '@features/appointments/types'
import { getAccountProfile } from '@features/auth/queries'
import { getSession } from '@shared/auth/session'

export const metadata: Metadata = {
  title: 'Afspraken maken',
}

interface Props {
  params: Promise<{ slug: string }>
}

export default async function AfspraakPage({ params }: Props) {
  const { slug } = await params
  const type = await getActiveTypeBySlug(slug)

  if (!type) {
    notFound()
  }

  const slots = await getSlotsForType(type)

  let prefill: BookingPrefill | null = null
  const session = await getSession()
  if (session && session.role === 'customer') {
    const profile = await getAccountProfile(session.user.id)
    if (profile) {
      prefill = {
        email: profile.email,
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        phone: profile.phone ?? '',
        userId: session.user.id,
      }
    }
  }

  return (
    <main
      style={{
        background: 'var(--bg)',
        minHeight: '100vh',
        padding: '24px 16px',
      }}
    >
      <BookingFlow
        prefill={prefill}
        slots={slots}
        type={type}
        variant="standalone"
      />
    </main>
  )
}
