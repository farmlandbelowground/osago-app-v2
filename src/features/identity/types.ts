export type IdentityStatus =
  | 'in_review'
  | 'not_started'
  | 'rejected'
  | 'verified'

export interface IdentityProfile {
  documentName: string | null
  documentType: string | null
  lastError: string | null
  sessionId: string | null
  status: IdentityStatus
  submittedAt: string | null
  verifiedAt: string | null
}
