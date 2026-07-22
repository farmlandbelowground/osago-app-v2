'use server'

import { redirect } from 'next/navigation'

import { getServerClient } from '@shared/supabase/server'

import { clearImpersonation } from './impersonation'

export const logout = async (): Promise<never> => {
  const supabase = await getServerClient()
  // Clear any impersonation marker so it can't outlive the session. Note: this
  // does a full logout even mid-impersonation (the faithful "return to admin"
  // path is the ImpersonationBanner's exit button, which restores the admin
  // session from the browser-stored tokens).
  await clearImpersonation()
  await supabase.auth.signOut()
  redirect('/')
}
