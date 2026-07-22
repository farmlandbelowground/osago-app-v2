export const ADMIN_KLANTEN_PATH = '/admin/klanten'
export const ADMIN_PROJECTEN_PATH = '/admin/projecten'

export const SIGNUP_ENDPOINT = '/api/auth/signup'
export const DOCS_BUCKET = 'osago-documents'
export const DOC_MAX_SIZE_BYTES = 25 * 1024 * 1024
export const PASSWORD_MIN_LENGTH = 8
export const DOWNLOAD_URL_TTL_SECONDS = 300
export const PROGRESS_PERCENT_MULTIPLIER = 100

export const PROJECT_ID_PREFIX = 'P'
export const PROJECT_ID_PAD = 6
export const PROJECT_TYPE_VERKOOP = 'verkoop'
export const PROJECT_TYPE_WAARDEBEPALING = 'waardebepaling'

export const PROJECT_TYPE_LABELS = {
  verkoop: 'Verkoop',
  waardebepaling: 'Waardebepaling',
} as const

// The project-card "verst gevorderd" summary reuses @features/leads LEAD_STAGES
// (DB enum order, excluding no_interest) — see lib/projectCard.
export const SOURCE_OPTIONS = ['Brookz', 'Bedrijventekoop.nl', 'MKBase'] as const
