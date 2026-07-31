import { z } from 'zod'

import { IDENTITY_STATUSES } from './constants'

export const IdentityStatusSchema = z.enum(IDENTITY_STATUSES)

// Projection over public.profiles used by getIdentityStatus + webhook writers.
// Column names match migration 0016.
export const IdentityProfileRowSchema = z.object({
  stripe_identity_document_name: z.string().nullable(),
  stripe_identity_document_type: z.string().nullable(),
  stripe_identity_last_error: z.string().nullable(),
  stripe_identity_session_id: z.string().nullable(),
  stripe_identity_status: IdentityStatusSchema,
  stripe_identity_submitted_at: z.string().nullable(),
  stripe_identity_verified_at: z.string().nullable(),
})

export type IdentityProfileRow = z.infer<typeof IdentityProfileRowSchema>

// Stripe Identity webhook events we handle. The full event has many fields;
// we only pin what we need at the boundary (id + type + data.object).
export const StripeVerificationSessionSchema = z.object({
  id: z.string(),
  last_error: z
    .object({ code: z.string().optional(), reason: z.string() })
    .nullable()
    .optional(),
  metadata: z.record(z.string(), z.string()).default({}),
  status: z.enum([
    'canceled',
    'processing',
    'redacted',
    'requires_input',
    'verified',
  ]),
  verified_outputs: z
    .object({
      first_name: z.string().optional(),
      id_number_type: z.string().optional(),
      last_name: z.string().optional(),
    })
    .nullable()
    .optional(),
})

export const StripeIdentityEventSchema = z.object({
  data: z.object({ object: StripeVerificationSessionSchema }),
  id: z.string(),
  type: z.enum([
    'identity.verification_session.canceled',
    'identity.verification_session.created',
    'identity.verification_session.processing',
    'identity.verification_session.requires_input',
    'identity.verification_session.verified',
  ]),
})

export type StripeIdentityEvent = z.infer<typeof StripeIdentityEventSchema>
