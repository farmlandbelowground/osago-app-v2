export const PASSWORD_MIN_LENGTH = 9
export const PASSWORD_REQUIREMENTS_TOOLTIP =
  'Minimaal 9 tekens, met ten minste 1 letter, 1 cijfer en 1 symbool (bv. ! @ # $ %).'
export const TWO_FACTOR_CODE_LENGTH = 6

export const TURNSTILE_VERIFY_ENDPOINT = '/api/turnstile/verify'
export const TWO_FACTOR_SEND_ENDPOINT = '/api/2fa/send'
export const TWO_FACTOR_VERIFY_ENDPOINT = '/api/2fa/verify'
export const TWO_FACTOR_UPDATE_PHONE_ENDPOINT = '/api/2fa/update-phone'
export const PASSWORD_RESET_ENDPOINT = '/api/auth/password-reset'

export const ACCOUNT_PATH = '/account'
export const DASHBOARD_PATH = '/dashboard'
// Admins land in the admin environment after login. Legacy sent them to
// /admin/dashboard, which is a Slice 13 page not built yet — /admin/account is
// the admin-shell landing that exists today.
export const ADMIN_ACCOUNT_PATH = '/admin/account'
export const LOGIN_PATH = '/'
export const RESET_PASSWORD_PATH = '/reset-password'

export const ACCOUNT_PHOTO_MAX_SIZE_MB = 5
export const ACCOUNT_PHOTO_MAX_SIZE_BYTES =
  ACCOUNT_PHOTO_MAX_SIZE_MB * 1024 * 1024
export const ALLOWED_ACCOUNT_PHOTO_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const
export const ACCOUNT_PHOTO_PREVIEW_SIZE_PX = 64
export const ACCOUNT_AVATAR_INITIALS_FONT_SIZE_PX = 20

export const PASSWORD_RESET_REDIRECT_DELAY_MS = 1_400
export const PASSWORD_RESET_SESSION_TIMEOUT_MS = 5_000
export const PASSWORD_RESET_SESSION_POLL_INTERVAL_MS = 150

export const ADMIN_AVAILABILITY_STORAGE_KEY = 'admin-availability'
