// Minimal Stripe types — we validate at the boundary with Zod, so we only
// declare the shapes we actually consume. Reference: docs.stripe.com/api/
// identity/verification_sessions

export interface StripeVerificationSession {
  client_secret: string | null
  id: string
  last_error: { code: string; reason: string } | null
  metadata: Record<string, string>
  status:
    | 'canceled'
    | 'processing'
    | 'redacted'
    | 'requires_input'
    | 'verified'
  url: string | null
  verified_outputs: {
    first_name?: string
    id_number_type?: string
    last_name?: string
  } | null
}

export interface StripeError {
  error: {
    code?: string
    message: string
    type: string
  }
}
