import { getServerClient } from '@shared/supabase/server'

import { IdentityProfileRowSchema } from './schema'
import { type IdentityProfile } from './types'

const emptyProfile = (): IdentityProfile => ({
  documentName: null,
  documentType: null,
  lastError: null,
  sessionId: null,
  status: 'not_started',
  submittedAt: null,
  verifiedAt: null,
})

export const getIdentityStatus = async (
  userId: string,
): Promise<IdentityProfile> => {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'stripe_identity_session_id, stripe_identity_status, stripe_identity_submitted_at, stripe_identity_verified_at, stripe_identity_document_name, stripe_identity_document_type, stripe_identity_last_error',
    )
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) return emptyProfile()

  const parsed = IdentityProfileRowSchema.safeParse(data)
  if (!parsed.success) return emptyProfile()

  const row = parsed.data
  return {
    documentName: row.stripe_identity_document_name,
    documentType: row.stripe_identity_document_type,
    lastError: row.stripe_identity_last_error,
    sessionId: row.stripe_identity_session_id,
    status: row.stripe_identity_status,
    submittedAt: row.stripe_identity_submitted_at,
    verifiedAt: row.stripe_identity_verified_at,
  }
}
