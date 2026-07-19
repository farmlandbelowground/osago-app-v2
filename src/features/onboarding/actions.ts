'use server'

import { redirect } from 'next/navigation'

import { DASHBOARD_PATH } from '@features/auth'
import { requireSession } from '@shared/auth/session'
import { getServerClient } from '@shared/supabase/server'

export const completeOnboarding = async (): Promise<never> => {
  const session = await requireSession()
  const supabase = await getServerClient()

  await supabase
    .from('profiles')
    .update({ onboarding_seen: true, onboarding_completed: true })
    .eq('id', session.user.id)

  redirect(DASHBOARD_PATH)
}

export const exitOnboarding = async (): Promise<never> => {
  const session = await requireSession()
  const supabase = await getServerClient()

  await supabase
    .from('profiles')
    .update({ onboarding_seen: true })
    .eq('id', session.user.id)

  redirect(DASHBOARD_PATH)
}
