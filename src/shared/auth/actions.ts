'use server'

import { redirect } from 'next/navigation'

import { getServerClient } from '@shared/supabase/server'

export const logout = async (): Promise<never> => {
  const supabase = await getServerClient()
  await supabase.auth.signOut()
  redirect('/')
}
