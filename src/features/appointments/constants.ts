import { type LocationOption } from './types'

export const APPOINTMENT_TYPES_TABLE = 'appointment_types'
export const APPOINTMENT_BOOKINGS_TABLE = 'appointment_bookings'

export const AFSPRAAK_PATH = '/afspraak'
export const ACCOUNT_PATH = '/account'
export const ADMIN_AFSPRAKEN_PATH = '/admin/afspraken'
export const ADMIN_AFSPRAKEN_INSTELLINGEN_PATH = '/admin/afspraken-instellingen'

export const SEND_TEMPLATE_ENDPOINT = '/api/email/send-template'
export const TURNSTILE_VERIFY_ENDPOINT = '/api/turnstile/verify'

export const APPOINTMENT_CONFIRMATION_CUSTOMER_TEMPLATE =
  'appointment_confirmation_customer'
export const APPOINTMENT_INVITATION_ADMIN_TEMPLATE =
  'appointment_invitation_admin'
export const APPOINTMENT_CANCELLATION_CUSTOMER_TEMPLATE =
  'appointment_cancellation_customer'

export const CTA_SLUG_PROEFADVIES = 'proefadvies'
export const CTA_SLUG_VOORTGANG = 'voortgang'
export const CTA_LABEL_PROEFADVIES = 'Kennismaking inplannen'
export const CTA_LABEL_VOORTGANG = 'Voortgangsgesprek inplannen'
export const ACTIVE_SUBSCRIPTION_STATUSES = ['active', 'ending', 'renewed']

export const DEFAULT_APPOINTMENT_COLOR = '#00B33C'
export const DEFAULT_LOCATION_KIND = 'video'
export const DEFAULT_NEW_LOCATION_DETAILS = 'Microsoft Teams'
export const OFFICE_LOCATION_FALLBACK =
  'Osago kantoor — Dorpstraat 105, 4661 HN Halsteren'
export const SUPPORT_EMAIL = 'support@osago.nl'
export const ADVISOR_FALLBACK_NAME = 'Osago'

export const LOCATION_OPTIONS: readonly LocationOption[] = [
  { label: 'Online (video)', value: 'video' },
  { label: 'Telefonisch', value: 'phone' },
  { label: 'Op kantoor', value: 'office' },
]

export const CALENDAR_WEEKDAY_HEADERS = [
  'ma',
  'di',
  'wo',
  'do',
  'vr',
  'za',
  'zo',
] as const

export const MS_PER_MINUTE = 60_000
export const MS_PER_DAY = 86_400_000
export const CANCEL_MIN_NOTICE_MS = 3_600_000

export const DEFAULT_DURATION_MIN = 30
export const DEFAULT_BUFFER_MIN = 0
export const DEFAULT_NEW_BUFFER_MIN = 15
export const DEFAULT_ADVANCE_NOTICE_MIN = 60
export const DEFAULT_ROLLING_DAYS = 30

export const DURATION_MIN = 5
export const DURATION_MAX = 480
export const DURATION_STEP = 5
export const BUFFER_MIN = 0
export const BUFFER_MAX = 60
export const BUFFER_STEP = 5
export const ADVANCE_MIN = 0
export const ADVANCE_MAX = 2880
export const ADVANCE_STEP = 15
export const ROLLING_MIN = 1
export const ROLLING_MAX = 180
export const ROLLING_STEP = 1

export const SLUG_MAX_LENGTH = 60
export const SLUG_FALLBACK = 'afspraak'
export const SLUG_UNIQUE_START_INDEX = 2

export const SEND_TEMPLATE_MAX_RECIPIENTS = 5
export const ICS_FILE_NAME = 'osago-afspraak.ics'
export const ICS_DATA_URI_PREFIX = 'data:text/calendar;base64,'

export const WEEK_LENGTH = 7
export const MONDAY_FIRST_OFFSET = 6
export const SIDEBAR_WIDTH_PX = 260
export const OVERLAY_Z_INDEX = 20

export const DAY_CELL_FONT_WEIGHT_ACTIVE = 600
export const DAY_CELL_FONT_WEIGHT_DEFAULT = 500
export const DAY_CELL_PAST_OPACITY = 0.3
