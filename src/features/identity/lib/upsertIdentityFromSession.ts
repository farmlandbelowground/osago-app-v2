import { getServiceRoleClient } from '@shared/supabase/server'

import { mapStripeStatus } from './mapStripeStatus'
import { type StripeVerificationSession } from './stripe'

// Minimal structural shape that both the REST-call return type
// (StripeVerificationSession) and the webhook's Zod-parsed shape satisfy —
// avoiding a mismatch on fields the writer doesn't need (client_secret, url).
export interface IdentitySessionSnapshot {
  id: StripeVerificationSession['id']
  last_error?:
    | { code?: string; reason: string }
    | null
    | undefined
  status: StripeVerificationSession['status']
  verified_outputs?:
    | { first_name?: string; id_number_type?: string; last_name?: string }
    | null
    | undefined
}

// Merges a Stripe VerificationSession snapshot back into public.profiles.
// Called by both the "start" server action, the "refresh" server action, and
// the webhook — so kept as a plain helper (no 'use server' file). Idempotent:
// Stripe may deliver the same event twice, and a re-run overwrites with the
// same values.
//
// Uses the service-role client because the webhook path has no authenticated
// user session; callers from the app path pass the user id explicitly, so the
// caller-side session guard is what enforces authorization.
export const upsertIdentityFromSession = async (
  userId: string,
  session: IdentitySessionSnapshot,
): Promise<void> => {
  const nextStatus = mapStripeStatus(session.status)
  const verifiedName = session.verified_outputs?.first_name
    ? [
        session.verified_outputs.first_name,
        session.verified_outputs.last_name,
      ]
        .filter(Boolean)
        .join(' ')
    : null

  const supabase = getServiceRoleClient()
  await supabase
    .from('profiles')
    .update({
      stripe_identity_document_name:
        nextStatus === 'verified' ? verifiedName : null,
      stripe_identity_document_type:
        nextStatus === 'verified'
          ? (session.verified_outputs?.id_number_type ?? null)
          : null,
      stripe_identity_last_error:
        nextStatus === 'rejected'
          ? (session.last_error?.reason ?? null)
          : null,
      stripe_identity_session_id: session.id,
      stripe_identity_status: nextStatus,
      stripe_identity_verified_at:
        nextStatus === 'verified' ? new Date().toISOString() : null,
    })
    .eq('id', userId)
}
