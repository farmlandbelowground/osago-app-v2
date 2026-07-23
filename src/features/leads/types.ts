export type LeadType =
  'auto_identified' | 'manual' | 'osago_validated' | 'pipeline'

export type LeadStage =
  | 'closing'
  | 'contact_made'
  | 'interest_confirmed'
  | 'negotiation'
  | 'new'
  | 'no_interest'

export type ValidationStatus = 'pending_validation' | 'validated'

export type LeadSourceVariant = 'auto' | 'manual' | 'osago'

export type ManualPromoteMode = 'self' | 'validation'

export type SalesDocumentKind = 'contract' | 'loi' | 'nda'

export interface Lead {
  addedAt: string
  addedManually: boolean
  autoSourceWebsite: string | null
  city: string | null
  contactEmail: string | null
  contactFirstName: string | null
  contactLastName: string | null
  contactLegacy: string | null
  contactPhone: string | null
  country: string | null
  fitScore: number | null
  houseNumber: string | null
  houseNumberAddition: string | null
  id: string
  leadType: LeadType
  location: string | null
  name: string | null
  notes: string | null
  postalCode: string | null
  promotedAt: string | null
  promotedFromManualAt: string | null
  promotedFromOsagoLeadAt: string | null
  promotedToPipeline: boolean
  sector: string | null
  source: string | null
  stage: LeadStage | null
  street: string | null
  type: string | null
  userId: string
  validatedAt: string | null
  validatedBy: string | null
  validatedByOsago: boolean
  validationFee: number | null
  validationPaidAt: string | null
  validationStatus: ValidationStatus | null
  website: string | null
}

export interface IdentifiedBuyer {
  name: string
  fitScore?: number
  location?: string
  rationale?: string
  type?: string
  website?: string
}

export interface ManualLeadInput {
  city: string
  contactEmail: string
  contactFirstName: string
  contactLastName: string
  contactPhone: string
  country: string
  houseNumber: string
  houseNumberAddition: string
  name: string
  notes: string
  postalCode: string
  street: string
  type: string
}

export interface PipelineLeadInput {
  city: string
  contactEmail: string
  contactFirstName: string
  contactLastName: string
  contactPhone: string
  country: string
  fitScore: number
  houseNumber: string
  houseNumberAddition: string
  notes: string
  postalCode: string
  stage: LeadStage
  street: string
}

export interface BuyerPipelineCounts {
  activeConversations: number
  identifiedBuyers: number
}
