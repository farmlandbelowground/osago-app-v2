import { env } from '@/env'

import { stripeFetch } from './stripeFetch'
import { type StripeVerificationSession } from './types'

interface CreateInput {
  email: string
  userId: string
}

// Creates a Stripe Identity VerificationSession of type "document" (ID scan +
// selfie — the Osago default). We pass the Supabase user id + email as
// metadata so the webhook can locate the profile without a lookup roundtrip.
// Return URLs point back to /account?stripe_identity=return; the account page
// re-reads the profile on load, so no separate query param handler is needed.
export const createVerificationSession = async (
  input: CreateInput,
): Promise<StripeVerificationSession> => {
  const returnUrl = `${env.APP_URL}/account?stripe_identity=return`
  return stripeFetch<StripeVerificationSession>(
    '/identity/verification_sessions',
    {
      body: {
        'metadata[email]': input.email,
        'metadata[user_id]': input.userId,
        return_url: returnUrl,
        type: 'document',
      },
      method: 'POST',
    },
  )
}
