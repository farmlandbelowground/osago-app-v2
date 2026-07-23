export const PARTNERS_TABLE = 'partners'

export const PARTNER_PATH = '/partner'
export const ADMIN_PARTNERS_PATH = '/admin/partners'

export const PARTNER_ID_PREFIX = 'prt_'

export const SLUG_MAX_LENGTH = 60
export const SLUG_FALLBACK = 'partner'
export const SLUG_UNIQUE_START_INDEX = 2

export const ALLOWED_LOGO_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/svg+xml',
] as const
export const LOGO_MAX_BYTES = 2 * 1024 * 1024
