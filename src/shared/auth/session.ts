import { type User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

import { getServerClient } from '@shared/supabase/server'

import { type ProfileRole } from './types'

export interface AuthSession {
  accessToken: string
  firstName: string | null
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

  const [{ data: sessionData }, { data: profile, error: profileError }] =
    await Promise.all([
      supabase.auth.getSession(),
      supabase
        .from('profiles')
        .select('role, first_name, last_name, onboarding_seen, photo')
        .eq('id', userData.user.id)
        .single(),
    ])

  if (!sessionData.session || profileError || !profile) {
    return null
  }

  return {
    accessToken: sessionData.session.access_token,
    firstName: profile.first_name,
    lastName: profile.last_name,
    onboardingSeen: profile.onboarding_seen,
    photo: profile.photo,
    role: profile.role as ProfileRole,
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
