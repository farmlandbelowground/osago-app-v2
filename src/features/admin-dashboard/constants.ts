import { type DashboardPreset } from './types'

export const ADMIN_DASHBOARD_PATH = '/admin/dashboard'

export const DASHBOARD_PRESETS: readonly DashboardPreset[] = [
  'all',
  'month',
  'quarter',
  'year',
  'custom',
]

export const DASHBOARD_PRESET_LABELS: Record<DashboardPreset, string> = {
  all: 'Alles',
  custom: 'Aangepast',
  month: 'Deze maand',
  quarter: 'Dit kwartaal',
  year: 'Dit jaar',
}

// Donut geometry + palette, ported verbatim from donutHTML (osago-bundle.js:24954).
export const DONUT_RADIUS = 50
export const DONUT_STROKE_WIDTH = 22
export const DONUT_VIEWBOX = 140
export const DONUT_CENTER = 70
export const DONUT_TOTAL_TEXT_Y = 68
export const DONUT_LABEL_TEXT_Y = 86
export const DONUT_TRACK_COLOR = '#F1F4F1'
export const DONUT_VERKOOP_COLOR = '#1F7A52'
export const DONUT_WAARDE_COLOR = '#D89B2C'
export const SPLIT_BAR_ZONDER_COLOR = '#D5D9D2'

export const KPI_ICON_SIZE = 18
export const RECENT_CUSTOMERS_LIMIT = 5
export const EURO_MILLION_THRESHOLD = 1_000_000
export const PERCENT_MULTIPLIER = 100
export const QUARTER_MONTHS = 3
export const LAST_MONTH_INDEX = 11
export const LAST_DAY_OF_DECEMBER = 31
export const END_OF_DAY_HOURS = 23
export const END_OF_DAY_MINUTES = 59
export const END_OF_DAY_SECONDS = 59
export const END_OF_DAY_MS = 999
export const MONEY_DECIMALS = 2

// Subscription statuses counted as "lopend" (osago-bundle.js:12706).
export const LOPEND_STATUSES = ['active', 'ending', 'renewed'] as const
