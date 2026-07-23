import { type AvailabilityWeekday } from '@shared/types/availability'

import { type StaffRole } from './types'

export const ADMIN_MEDEWERKER_PATH = '/admin/medewerker'

export const CREATE_STAFF_ENDPOINT = '/api/admin/create-staff'
export const UPDATE_USER_ENDPOINT = '/api/admin/update-user'

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  admin: 'Admin',
  user: 'User',
}

// Legacy renders the rooster preview Monday-first with two-letter labels
// (osago-bundle.js:28882), even though the schedule editor uses APPT_WEEKDAYS
// (Sunday-first).
export const ROOSTER_PREVIEW_DAYS: readonly {
  key: AvailabilityWeekday
  letter: string
}[] = [
  { key: 'monday', letter: 'Ma' },
  { key: 'tuesday', letter: 'Di' },
  { key: 'wednesday', letter: 'Wo' },
  { key: 'thursday', letter: 'Do' },
  { key: 'friday', letter: 'Vr' },
  { key: 'saturday', letter: 'Za' },
  { key: 'sunday', letter: 'Zo' },
]

export const TEAM_AVATAR_SIZE = 48
export const INACTIVE_CARD_OPACITY = 0.65

// Profielfoto upload limit, ported from legacy PHOTO_MAX_SIZE_BYTES
// (osago-bundle.js:6587 — 5 MB).
export const PHOTO_MAX_SIZE_MB = 5
export const PHOTO_MAX_SIZE_BYTES = PHOTO_MAX_SIZE_MB * 1024 * 1024

// Password policy text + generator charset, ported from legacy PASSWORD_POLICY /
// generatePassword (osago-bundle.js:3216-3341). The password field is cosmetic
// here (create does not provision a real Auth user — D-B), but reproduced for
// UI parity. Ambiguity-prone characters (l/I/O/0/1) are omitted.
export const PASSWORD_POLICY_TEXT =
  'Minimaal 9 tekens, met ten minste 1 letter, 1 cijfer en 1 symbool (bv. ! @ # $ %).'
export const PASSWORD_MIN_LENGTH = 9
export const PASSWORD_GEN_LENGTH = 14
export const PASSWORD_GEN_LOWER = 'abcdefghijkmnopqrstuvwxyz'
export const PASSWORD_GEN_UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
export const PASSWORD_GEN_DIGITS = '23456789'
export const PASSWORD_GEN_SYMBOLS = '!@#$%&*?+-='
