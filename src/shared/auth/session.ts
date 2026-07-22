import { type User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

import { getServerClient } from '@shared/supabase/server'

import { readImpersonation } from './impersonation'
import { type ProfileRole } from './types'

export interface AuthSession {
  accessToken: string
  firstName: string | null
  impersonatedBy: string | null
  impersonatedEmail: string | null
  lastName: string | null
  onboardingSeen: boolean
  photo: string | null
  role: ProfileRole
  user: User
}

export const getSession = async (): Promise<AuthSession | null> => {
  const supabase = await getServerClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    return null
  }

  const [
    { data: sessionData },
    { data: profile, error: profileError },
    impersonation,
  ] = await Promise.all([
    supabase.auth.getSession(),
    supabase
      .from('profiles')
      .select('role, first_name, last_name, onboarding_seen, photo')
      .eq('id', userData.user.id)
      .single(),
    readImpersonation(),
  ])

  if (!sessionData.session || profileError || !profile) {
    return null
  }

  const role = profile.role as ProfileRole
  // Only a customer session carries an impersonation — an admin is never
  // impersonating themselves, so a stale marker on an admin session is ignored.
  const marker = role === 'customer' ? impersonation : null

  return {
    accessToken: sessionData.session.access_token,
    firstName: profile.first_name,
    impersonatedBy: marker?.adminId ?? null,
    impersonatedEmail: marker?.adminEmail ?? null,
    lastName: profile.last_name,
    onboardingSeen: profile.onboarding_seen,
    photo: profile.photo,
    role,
    user: userData.user,
  }
}

export const requireSession = async (): Promise<AuthSession> => {
  const session = await getSession()

  if (!session) {
    redirect('/')
  }

  return session
}
