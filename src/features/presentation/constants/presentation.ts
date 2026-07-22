import {
  type PresentationGenerateVariant,
  type RegenerateDocumentType,
} from '../types'

// Foto's per tab — upload + Unsplash caps (osago-bundle.js:18630-18631).
export const PRES_MAX_PHOTOS_PER_TAB = 8
export const PRES_MAX_UPLOAD_BYTES = 5 * 1024 * 1024

// Own-upload id suffix: Math.random().toString(36).slice(2, 8) (osago-bundle.js:18732).
export const PHOTO_ID_RANDOM_RADIX = 36
export const PHOTO_ID_RANDOM_SLICE_END = 8

// AI-compose doc-type + same-fieldset label for presentation fields
// (osago-bundle.js callAiForField :16165, :16205).
export const PRESENTATION_AI_DOC_TYPE = 'verkoopmemorandum'
export const PRESENTATION_SAME_FIELDSET_LABEL = 'Andere velden op deze tab'

// Filename title noun per variant — drives the "reeds gemaakt" prefix match
// against DOCUMENT_PREFIXES (osago-bundle.js:19708, :19767).
export const GAMMA_DOC_TITLE_NOUN: Record<PresentationGenerateVariant, string> =
  {
    memorandum: 'Verkoopmemorandum',
    teaser: 'Anoniem verkoopprofiel',
  }

// Vault description written with the generated document (osago-bundle.js:19776).
export const GAMMA_DOC_DESCRIPTION =
  'Bewerkbaar PowerPoint-bestand — controleer de inhoud en pas aan waar nodig vóór je het deelt.'

// €199 regenerate-request modal copy (osago-bundle.js REGEN_DOC_INFO :12270-12276).
export const REGEN_DOC_FEE = '€ 199,-'

export interface RegenerateDocInfo {
  aanvraagTitel: string
  titleNice: string
}

export const REGEN_DOC_INFO: Record<RegenerateDocumentType, RegenerateDocInfo> =
  {
    memorandum: {
      titleNice: 'verkoopmemorandum',
      aanvraagTitel: 'Heraanmaak verkoopmemorandum',
    },
    anoniem: {
      titleNice: 'anoniem verkoopprofiel',
      aanvraagTitel: 'Heraanmaak anoniem verkoopprofiel',
    },
    waarderingsrapport: {
      titleNice: 'waarderingsrapport',
      aanvraagTitel: 'Heraanmaak waarderingsrapport',
    },
    verbeterrapport: {
      titleNice: 'verbeterrapport',
      aanvraagTitel: 'Heraanmaak verbeterrapport (Verkoopklaar maken)',
    },
  }

export const OPTIONAL_BADGE_LABEL = 'Optioneel'

export const UNSPLASH_SEARCH_MIN_QUERY_LENGTH = 1

// ── Slice 13 — medewerker (impersonation) presentation tools ──
// Internal notifications go to the default Osago support inbox (legacy sends
// internal templates to template.fromEmail || 'support@osago.nl').
export const INTERNAL_NOTIFICATION_EMAIL = 'support@osago.nl'

// admin_reset_notice email copy per reset type (osago-bundle.js ADMIN_RESET_CONFIG).
export const MEMORANDUM_RESET_NOTICE = {
  onderdeel: 'Verkoopmemorandum',
  onderdeelLc: 'het verkoopmemorandum',
  toelichting:
    'Het memorandum is uit jouw Documentenkluis verwijderd. Op de Presentatie-pagina kun je een nieuwe versie genereren.',
} as const

export const ANONIEM_RESET_NOTICE = {
  onderdeel: 'Anoniem verkoopprofiel',
  onderdeelLc: 'het anonieme verkoopprofiel',
  toelichting:
    'Het anonieme profiel is uit jouw Documentenkluis verwijderd. Op de Presentatie-pagina kun je een nieuwe versie genereren.',
} as const
