import { type StripeVerificationSession } from '../lib/stripe'
import { type IdentityStatus } from '../types'

// Collapse Stripe's 5 statuses into the 4 the UI uses:
//   verified         → 'verified'
//   processing       → 'in_review'    (submitted, being assessed)
//   requires_input   → 'rejected'     (user needs to retry — docx: "Rejected")
//   canceled/redacted→ 'not_started'  (session invalidated; user starts over)
//
// `requires_input` after a `processing` is Stripe's failure signal — the user
// gets a `last_error.reason` we surface in the UI's "cause" section.
export const mapStripeStatus = (
  status: StripeVerificationSession['status'],
): IdentityStatus => {
  if (status === 'verified') return 'verified'
  if (status === 'processing') return 'in_review'
  if (status === 'requires_input') return 'rejected'
  return 'not_started'
}
