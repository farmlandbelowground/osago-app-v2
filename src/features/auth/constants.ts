export const PASSWORD_MIN_LENGTH = 9
export const PASSWORD_REQUIREMENTS_TOOLTIP =
  'Minimaal 9 tekens, met ten minste 1 letter, 1 cijfer en 1 symbool (bv. ! @ # $ %).'
export const TWO_FACTOR_CODE_LENGTH = 6

export const TURNSTILE_VERIFY_ENDPOINT = '/api/turnstile/verify'
export const SIGNUP_ENDPOINT = '/api/auth/signup'
export const TWO_FACTOR_SEND_ENDPOINT = '/api/2fa/send'
export const TWO_FACTOR_VERIFY_ENDPOINT = '/api/2fa/verify'
export const TWO_FACTOR_UPDATE_PHONE_ENDPOINT = '/api/2fa/update-phone'
export const PASSWORD_RESET_ENDPOINT = '/api/auth/password-reset'

export const DASHBOARD_PATH = '/dashboard'
export const LOGIN_PATH = '/'
export const RESET_PASSWORD_PATH = '/reset-password'

export const PASSWORD_RESET_REDIRECT_DELAY_MS = 1_400
export const PASSWORD_RESET_SESSION_TIMEOUT_MS = 5_000
export const PASSWORD_RESET_SESSION_POLL_INTERVAL_MS = 150
