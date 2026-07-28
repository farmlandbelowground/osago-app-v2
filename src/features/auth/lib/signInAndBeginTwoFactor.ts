import { getBrowserClient } from '@shared/supabase/browser'

import { beginTwoFactorFlow } from '../actions'
import { type AuthFlowState } from '../types'

interface Args {
  email: string
  password: string
  signInErrorMessage: string
}

// The session is created by the browser client, not by a Server Action: a
// cookie mutation inside an action makes Next re-render the current route in the
// same response, and (auth)/page.tsx's signed-in guard would then redirect to
// the dashboard before the 2FA step can render. Legacy signed in from the
// browser too (osago-bundle.js:2112 → OsagoSupabase.signIn).
export const signInAndBeginTwoFactor = async ({
  email,
  password,
  signInErrorMessage,
}: Args): Promise<AuthFlowState> => {
  const { error } = await getBrowserClient().auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: signInErrorMessage, status: 'error' }
  }

  return beginTwoFactorFlow()
}
