export const HEURISTIC_DCF_PARAMS_DEFAULT = {
  discountRate: 12,
  terminalGrowth: 2,
  projectionYears: 10,
  growthFade: 15,
} as const

export const HEURISTIC_INITIAL_GROWTH_DEFAULT = 5

export const HEURISTIC_SECTOR_MULTIPLES = {
  'Software & SaaS': { ebitda: 8.5, revenue: 3.0 },
  'E-commerce': { ebitda: 6.0, revenue: 1.2 },
  'Industrie & Productie': { ebitda: 5.5, revenue: 0.8 },
  'Groothandel & Distributie': { ebitda: 5.0, revenue: 0.5 },
  'Bouw & Vastgoed': { ebitda: 4.5, revenue: 0.6 },
  'Logistiek & Transport': { ebitda: 5.0, revenue: 0.6 },
  'Zakelijke dienstverlening': { ebitda: 6.5, revenue: 1.0 },
  Gezondheidszorg: { ebitda: 7.5, revenue: 1.4 },
  'Horeca & Toerisme': { ebitda: 4.0, revenue: 0.7 },
  Retail: { ebitda: 5.0, revenue: 0.6 },
  'Financiële dienstverlening': { ebitda: 7.0, revenue: 1.8 },
  'Energie & Duurzaamheid': { ebitda: 6.5, revenue: 1.2 },
  Overig: { ebitda: 5.5, revenue: 0.8 },
} as const satisfies Record<string, { ebitda: number; revenue: number }>

export const HEURISTIC_SECTOR_MULTIPLES_FALLBACK_KEY = 'Overig'

export const HEURISTIC_MIDPOINT_EBITDA_WEIGHT = 0.5
export const HEURISTIC_MIDPOINT_REVENUE_WEIGHT = 0.2
export const HEURISTIC_MIDPOINT_DCF_WEIGHT = 0.3
export const HEURISTIC_LOW_BAND_RATIO = 0.82
export const HEURISTIC_HIGH_BAND_RATIO = 1.18

export const HEURISTIC_GROWTH_STRONG_THRESHOLD_PCT = 20
export const HEURISTIC_GROWTH_HEALTHY_THRESHOLD_PCT = 10
export const HEURISTIC_GROWTH_DECLINE_THRESHOLD_PCT = 0
export const HEURISTIC_GROWTH_STRONG_EBITDA_MULTIPLE_ADD = 1.5
export const HEURISTIC_GROWTH_STRONG_REVENUE_MULTIPLE_ADD = 0.4
export const HEURISTIC_GROWTH_HEALTHY_EBITDA_MULTIPLE_ADD = 0.7
export const HEURISTIC_GROWTH_HEALTHY_REVENUE_MULTIPLE_ADD = 0.2
export const HEURISTIC_GROWTH_DECLINE_EBITDA_MULTIPLE_ADD = -1.0
export const HEURISTIC_GROWTH_DECLINE_REVENUE_MULTIPLE_ADD = -0.2

export const HEURISTIC_RECURRING_HIGH_THRESHOLD_PCT = 70
export const HEURISTIC_RECURRING_MEDIUM_THRESHOLD_PCT = 40
export const HEURISTIC_RECURRING_HIGH_EBITDA_MULTIPLE_ADD = 1.2
export const HEURISTIC_RECURRING_HIGH_REVENUE_MULTIPLE_ADD = 0.5
export const HEURISTIC_RECURRING_MEDIUM_EBITDA_MULTIPLE_ADD = 0.5
export const HEURISTIC_RECURRING_MEDIUM_REVENUE_MULTIPLE_ADD = 0.2

export const HEURISTIC_EBITDA_MARGIN_STRONG_THRESHOLD_PCT = 25
export const HEURISTIC_EBITDA_MARGIN_WEAK_THRESHOLD_PCT = 10
export const HEURISTIC_EBITDA_MARGIN_STRONG_MULTIPLE_ADD = 0.5
export const HEURISTIC_EBITDA_MARGIN_WEAK_MULTIPLE_ADD = -0.5

export const HEURISTIC_SIZE_LARGE_THRESHOLD = 10_000_000
export const HEURISTIC_SIZE_SMALL_THRESHOLD = 1_000_000
export const HEURISTIC_SIZE_LARGE_MULTIPLE_ADD = 0.5
export const HEURISTIC_SIZE_SMALL_MULTIPLE_ADD = -0.5

export const HEURISTIC_EBITDA_MULTIPLE_FLOOR = 2
export const HEURISTIC_REVENUE_MULTIPLE_FLOOR = 0.2

export const HEURISTIC_DISCOUNT_TERMINAL_GROWTH_SAFETY_MARGIN = 0.005
export const HEURISTIC_PROJECTION_YEARS_MIN = 1
export const HEURISTIC_PROJECTION_YEARS_MAX = 30

export const HEURISTIC_BASE_YEAR_LOOKBACK_MAX = 5
export const HEURISTIC_REVENUE_GROWTH_PERCENT_SCALE = 1_000
export const HEURISTIC_REVENUE_GROWTH_ROUNDING_DIVISOR = 10
export const HEURISTIC_PERCENT_MULTIPLIER = 100
