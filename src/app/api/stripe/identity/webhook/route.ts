import { NextResponse, type NextRequest } from 'next/server'

import { env } from '@/env'
import { verifyWebhookSignature } from '@features/identity/lib/stripe'
import { upsertIdentityFromSession } from '@features/identity/lib/upsertIdentityFromSession'
import { StripeIdentityEventSchema } from '@features/identity/schema'

// Stripe Identity webhook. We verify HMAC-SHA256 signature, parse only the
// event types we care about, and merge the session snapshot into the profile.
// Idempotency: `upsertIdentityFromSession` is a straight column overwrite —
// duplicate deliveries produce the same terminal state.
//
// user_id lives in metadata.user_id (see createVerificationSession).

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const rawBody = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (
    !verifyWebhookSignature(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET_IDENTITY,
    )
  ) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 })
  }

  let parsedBody: unknown
  try {
    parsedBody = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const parsed = StripeIdentityEventSchema.safeParse(parsedBody)
  if (!parsed.success) {
    // Not an event we care about (e.g. .created); acknowledge so Stripe stops
    // retrying without treating it as an error.
    return NextResponse.json({ received: true })
  }

  const event = parsed.data
  const session = event.data.object
  const userId = session.metadata.user_id
  if (!userId) {
    return NextResponse.json(
      { error: 'missing user_id in metadata' },
      { status: 400 },
    )
  }

  await upsertIdentityFromSession(userId, session)
  return NextResponse.json({ received: true })
}
