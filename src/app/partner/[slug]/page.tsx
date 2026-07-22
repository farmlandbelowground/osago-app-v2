import { type Metadata } from 'next'
import { redirect } from 'next/navigation'

import { PartnerRegistration } from '@features/partners'
import { getActivePartnerBySlug } from '@features/partners/queries'
import { adminListVouchers } from '@features/subscriptions/queries'
import { type Voucher } from '@features/subscriptions/types'
import { getSession } from '@shared/auth/session'

export const metadata: Metadata = {
  title: 'Account aanmaken',
}

interface Props {
  params: Promise<{ slug: string }>
}

export default async function PartnerPage({ params }: Props) {
  const { slug } = await params

  // Don't override an existing session — an already-authenticated visitor is
  // sent to the app (legacy initPartnerAuth's `if(session) return`, OQ-3).
  const session = await getSession()
  if (session) {
    redirect('/dashboard')
  }

  const partner = await getActivePartnerBySlug(slug)
  if (!partner) {
    // Unknown/inactive slug → login, matching legacy showLogin() fallback (OQ-3).
    redirect('/')
  }

  // Resolve the linked voucher for the informational discount card. Under anon
  // RLS (vouchers_select: active = true) only an active voucher resolves, so an
  // inactive linked voucher simply hides the card. Branding only — the code is
  // not applied at registration (OQ-2, §3.4).
  let voucher: Voucher | null = null
  if (partner.voucherId) {
    const vouchers = await adminListVouchers()
    voucher = vouchers.find(item => item.id === partner.voucherId) ?? null
  }

  return <PartnerRegistration partner={partner} voucher={voucher} />
}
