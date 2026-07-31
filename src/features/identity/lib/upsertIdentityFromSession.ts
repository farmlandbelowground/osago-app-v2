import { getServiceRoleClient } from '@shared/supabase/server'

import { type StripeVerificationSession } from './stripe'
import { mapStripeStatus } from './mapStripeStatus'

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
  session: StripeVerificationSession,
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
