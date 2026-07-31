import { type IdentityStatus } from './types'

// The 4 statuses the app understands (docx §5 table). We narrow Stripe's
// broader status set (verified/processing/requires_input/canceled/redacted)
// down to these — see lib/mapStripeStatus.ts.
export const IDENTITY_STATUSES = [
  'not_started',
  'in_review',
  'verified',
  'rejected',
] as const satisfies readonly IdentityStatus[]

// Return-URL flag Stripe redirects users back with after the hosted flow.
export const IDENTITY_RETURN_FLAG = 'stripe_identity'
export const IDENTITY_RETURN_VALUE = 'return'
