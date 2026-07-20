export const APP_CONFIG_DCF_ADMIN_DEFAULTS_KEY = 'dcfAdminDefaults'

export const DCF_RISK_FREE_RATE_DEFAULT = 0.01
export const DCF_MARKET_RISK_PREMIUM_DEFAULT = 0.055
export const DCF_ILLIQUIDITY_PREMIUM_DEFAULT = 0.02
export const DCF_SECTORCORRECTIE_BASE_MULTIPLE = 4.5
export const DCF_SECTORCORRECTIE_STEP = 0.01

export const DCF_KLEIN_PREMIE_FACTORS = {
  adh: { waarde: 1.5, midPct: 0.0172 },
  afn: { waarde: 1.5, midPct: 0.0157 },
  alr: { waarde: 1.5, midPct: 0.0143 },
} as const

export const DCF_ASSET_RISK_FACTORS = {
  rep: { waarde: 0.5, midPct: 0.0115 },
  act: { waarde: 0.5, midPct: 0.0135 },
  toetr: { waarde: 0.5, midPct: 0.0137 },
  trackR: { waarde: 0.5, midPct: 0.0141 },
} as const

export const DCF_GROEIREST_PHASES = {
  startOntwikkeling: 1.0,
  groei: 0.5,
  stabiel: 0.0,
  teruggang: -0.9,
} as const

// Legacy dcfNewAllowedYearCounts (osago-bundle.js:4753-4760): the Mijn-bedrijf
// "in ontwikkeling" slider (0..4) restricts how short the scenario period may
// be. Slider 1/2 (0/1) → all; slider 3 (2) → 4 or 5; slider 4/5 (3/4) → 5 only.
export const DCF_SCENARIO_YEAR_COUNTS_UNRESTRICTED = [3, 4, 5] as const
export const DCF_SCENARIO_YEAR_COUNTS_MID = [4, 5] as const
export const DCF_SCENARIO_YEAR_COUNTS_HIGH = [5] as const
export const DCF_MARKT_ONTWIKKELING_LOW_MAX = 1
export const DCF_MARKT_ONTWIKKELING_MID = 2

export const DCF_SCENARIO_YEAR_COUNT_DEFAULT = 3
export const DCF_YEAR_COUNT_MIN = 1
export const DCF_YEAR_COUNT_MAX = 20
export const DCF_YEAR_COUNT_FALLBACK = 7
export const DCF_RESTWAARDE_CAP_RATIO = 0.75

export const DCF_HISTORICAL_YEARS_DISPLAYED = 4

export const DCF_UITGANGSPUNTEN_DEFAULT = {
  vermogensvoetRest: 0.25,
  groeiRest: 0.0,
  restwaardeCap: true,
} as const
