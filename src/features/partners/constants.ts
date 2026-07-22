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

// OQ-1 (§3.5 / §4.2): referral attribution (referredByPartnerId) is never
// captured in the frozen backend — there is no profiles.referred_by_partner_id
// column and no capture path — so v2 has no data source for the "Geregistreerd
// via partner" KPI or the per-row "Klanten" count. Both render this hardwired 0
// (legacy parity: the deployed legacy app also always showed 0). This is NOT a
// live metric; making it functional needs a backend/schema change (out of scope
// per §1.1), deferred to a future backend-scoped initiative.
export const PARTNER_REFERRAL_COUNT_PLACEHOLDER = 0
