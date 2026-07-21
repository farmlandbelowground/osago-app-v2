// The closed union of every field key across the presentation tabs
// (osago-bundle.js getPresExtTabs :19003-19094). `ext_*` keys are
// presentation-only; the others reuse the legacy PRESENTATION_FIELDS keys and
// share persistence with them.
export type PresentationFieldKey =
  | 'ext_tagline'
  | 'managementSummary'
  | 'ext_uniek_waarom'
  | 'companyProfile'
  | 'ext_historie'
  | 'ext_groeiverhaal'
  | 'ext_wat_aangeboden'
  | 'ext_transactievorm'
  | 'ext_deal_scope'
  | 'ext_randvoorwaarden'
  | 'organisation'
  | 'ext_juridische_structuur'
  | 'ext_werkmaatschappijen'
  | 'ext_organogram'
  | 'ext_overdraagbaarheid'
  | 'productsServices'
  | 'ext_kenmerken_doelgroep'
  | 'ext_geografische_regio'
  | 'ext_uitbreidingsmogelijkheden'
  | 'market'
  | 'growth'
  | 'ext_verkoopkanalen'
  | 'ext_marketing'
  | 'ext_leveranciers'
  | 'ext_online_aanwezigheid'
  | 'ext_social_media'
  | 'ext_huur_koop'
  | 'ext_vastgoed_wens'
  | 'ext_oppervlakte'
  | 'ext_locatiebeschrijving'
  | 'ext_locatie_bijzonderheden'
  | 'ext_systemen_software'
  | 'ext_integratie_overdracht'
  | 'swotStrengths'
  | 'swotWeaknesses'
  | 'swotOpportunities'
  | 'swotThreats'
  | 'ext_swot_voor_koper'
  | 'ext_processtappen'

// The company profile fields a presentation field can prefill from
// (osago-bundle.js PRESENTATION_FIELDS `prefill`, :21335-21346).
export type PresentationPrefillSource = 'description' | 'usp' | 'reasonForSale'

export interface PresentationFieldDef {
  half: boolean
  key: PresentationFieldKey
  label: string
  placeholder: string
  required: boolean
  rows: number
  prefill?: PresentationPrefillSource
  tooltip?: string
}

export interface PresentationTab {
  fields: PresentationFieldDef[]
  id: string
  label: string
  required: boolean
  sectionTitle: string
  special?: 'inhoud'
}

export type PresentationFields = Partial<Record<PresentationFieldKey, string>>

export interface PresentationPhoto {
  credit: string | null
  fullUrl: string
  id: string
  source: 'upload' | 'unsplash'
  thumbUrl: string
}

export type PresentationImages = Record<string, PresentationPhoto[]>

export type PresentationReviewStatus = 'none' | 'submitted' | 'approved'

export interface PresentationReview {
  status: 'submitted' | 'approved'
  approvedAt?: number
  approvedBy?: string
  submittedAt?: number
}

export interface PresentationExtra {
  presentationFields?: PresentationFields
  presentationImages?: PresentationImages
  presentationIncludeValuation?: boolean
  presentationReview?: PresentationReview
  presentationTabsHidden?: string[]
}

export interface PresentationData {
  fields: PresentationFields
  hiddenTabs: string[]
  includeValuation: boolean
  photos: PresentationImages
  reviewStatus: PresentationReviewStatus
}

// Document types the €199 regenerate-request modal covers
// (osago-bundle.js REGEN_DOC_INFO :12270-12275).
export type RegenerateDocumentType =
  'memorandum' | 'anoniem' | 'waarderingsrapport' | 'verbeterrapport'

// The two customer-facing generate variants on /verkooppresentatie.
export type PresentationGenerateVariant = 'memorandum' | 'teaser'

// Normalized /api/unsplash/search result item (search.js:46-51).
export interface UnsplashSearchResult {
  credit: string
  fullUrl: string
  id: string
  thumbUrl: string
}
