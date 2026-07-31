'use server'

import { revalidatePath } from 'next/cache'

import { requireSession } from '@shared/auth/session'
import { getServerClient } from '@shared/supabase/server'

import {
  createVerificationSession,
  retrieveVerificationSession,
} from './lib/stripe'
import { upsertIdentityFromSession } from './lib/upsertIdentityFromSession'
import { getIdentityStatus } from './queries'

interface StartResult {
  error: string | null
  url: string | null
}

interface RefreshResult {
  error: string | null
}

const nowIso = (): string => new Date().toISOString()

// Kicks off a fresh Stripe Identity VerificationSession and stamps the profile
// so the UI immediately reflects "in_review" without waiting for the webhook.
// Returns the Stripe-hosted URL — the client opens it in a new tab.
export const startIdentityVerification = async (): Promise<StartResult> => {
  const session = await requireSession()
  const userId = session.user.id
  const email = session.user.email ?? ''

  try {
    const stripeSession = await createVerificationSession({ email, userId })
    const supabase = await getServerClient()
    await supabase
      .from('profiles')
      .update({
        stripe_identity_last_error: null,
        stripe_identity_session_id: stripeSession.id,
        stripe_identity_status: 'in_review',
        stripe_identity_submitted_at: nowIso(),
        stripe_identity_verified_at: null,
      })
      .eq('id', userId)

    revalidatePath('/account')
    revalidatePath('/dashboard')

    return { error: null, url: stripeSession.url }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Verificatie starten mislukt.'
    return { error: message, url: null }
  }
}

// Fallback for when the webhook is late or a user clicks "Status vernieuwen".
// Reads the profile's stored session id and pulls the latest snapshot from
// Stripe; no-ops if there's no session yet.
export const refreshIdentityStatus = async (): Promise<RefreshResult> => {
  const session = await requireSession()
  const userId = session.user.id

  const profile = await getIdentityStatus(userId)
  if (!profile.sessionId) {
    return { error: null }
  }

  try {
    const stripeSession = await retrieveVerificationSession(profile.sessionId)
    await upsertIdentityFromSession(userId, stripeSession)
    revalidatePath('/account')
    revalidatePath('/dashboard')
    return { error: null }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Status ophalen mislukt.'
    return { error: message }
  }
}
