export const MIJN_BEDRIJF_PATH = '/mijn-bedrijf'

export const KVK_ZOEKEN_ENDPOINT = '/api/kvk/zoeken'
export const KVK_BASISPROFIEL_ENDPOINT = '/api/kvk/basisprofiel'

export const KVK_SEARCH_DEBOUNCE_MS = 300
export const KVK_SEARCH_MIN_QUERY_LENGTH = 2

export const APP_CONFIG_VALUATION_MULTIPLES_KEY = 'valuationMultiples'

export const FOUNDED_YEAR_MIN = 1900
export const FOUNDED_YEAR_MAX = 2026

export const BEDRIJF_MARKT_ONTWIKKELING_MIN = 0
export const BEDRIJF_MARKT_ONTWIKKELING_MAX = 4
export const BEDRIJF_MARKT_ONTWIKKELING_DEFAULT = 2
export const BEDRIJF_MARKT_ONTWIKKELING_TICKS = [0, 1, 2, 3, 4] as const
export const BEDRIJF_MARKT_ONTWIKKELING_TICK_POSITIONS_PCT = [
  0, 25, 50, 75, 100,
] as const

export const LOGO_PREVIEW_WIDTH_PX = 140
export const LOGO_PREVIEW_HEIGHT_PX = 96

export const ALLOWED_LOGO_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/svg+xml',
  'image/webp',
] as const

export const LEGAL_FORM_OPTIONS = [
  'Besloten vennootschap (B.V.)',
  'Naamloze vennootschap (N.V.)',
  'Eenmanszaak',
  'Vennootschap onder firma (V.O.F.)',
  'Maatschap',
  'Commanditaire vennootschap (C.V.)',
  'Stichting',
  'Vereniging',
  'Coöperatie',
  'Onderlinge waarborgmaatschappij',
  'Europese naamloze vennootschap (S.E.)',
  'Anders',
] as const

// The fixed key list legacy checks for KVK-prefill overwrite conflicts
// (osago-bundle.js:8387) — 'sector' is included even though it can never
// actually trigger, since sector is never derived from KVK (see schema.ts).
export const KVK_CONFLICT_CHECK_KEYS = [
  'name',
  'website',
  'founded',
  'employees',
  'sector',
  'street',
  'houseNumber',
  'houseNumberExtra',
  'postalCode',
  'city',
] as const
