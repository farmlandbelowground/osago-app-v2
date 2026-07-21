export interface ScorecardItem {
  id: string
  label: string
}

export interface ScorecardCategoryRef {
  id: string
  label: string
}

export interface ScorecardCategory extends ScorecardCategoryRef {
  items: readonly ScorecardItem[]
}

// The company inputs the relevance filter reads — the camelCase domain shape
// legacy's `getFilteredScorecard(company)` consumes (osago-bundle.js:6923-6941).
// Slice 13's queries.ts maps the raw `companies` row (legal_form, extra.employees)
// onto this before calling the pure lib.
export interface ScorecardCompanyInput {
  employees: number | null
  legalForm: string | null
  name: string | null
  sector: string | null
}

export interface ScorecardTabStats {
  answered: number
  avg: number | null
  id: string
  label: string
  pct: number
  total: number
}

export interface ScorecardStats {
  overallAvg: number | null
  overallLabel: string
  overallPct: number
  ratedCount: number
  tabStats: ScorecardTabStats[]
  totalAnswered: number
  totalQuestions: number
  verbeterCount: number
}

export type ScorecardImprovementPriorityId =
  'gedeeltelijk' | 'grotendeels' | 'niet'

export interface ScorecardImprovementPoint {
  answer: ScorecardImprovementPriorityId
  item: ScorecardItem
  notes: string
}

export interface ScorecardImprovementCategory {
  category: ScorecardCategoryRef
  points: ScorecardImprovementPoint[]
}

export interface ScorecardImprovementReportData {
  categories: ScorecardImprovementCategory[]
  hoogCount: number
  laagCount: number
  middelCount: number
  overallLabel: string
  overallPct: number
  totalAnswered: number
  totalPoints: number
  totalQuestions: number
}
