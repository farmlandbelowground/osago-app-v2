import { stripeFetch } from './stripeFetch'
import { type StripeVerificationSession } from './types'

// Refresh path — used both by the "Status vernieuwen" button and by the
// account page after a return-URL redirect, so the UI shows fresh state
// without waiting on the webhook.
export const retrieveVerificationSession = async (
  sessionId: string,
): Promise<StripeVerificationSession> =>
  stripeFetch<StripeVerificationSession>(
    `/identity/verification_sessions/${sessionId}`,
  )
