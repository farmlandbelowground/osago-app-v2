import { type ScorecardAnswerId } from '../schema'
import { type ScorecardImprovementPriorityId } from '../types'

export interface ScorecardAnswerOption {
  id: ScorecardAnswerId
  label: string
  percentage: number | null
  score: number | null
  short: string
}

// osago-bundle.js:6857-6863. `score` (1-4) drives the "Gemiddelde score" KPI;
// `percentage` (0-100) drives the "Verkoopklaar-rating" KPI. `nvt` carries null
// for both and is excluded from every average. The legacy `color` field is a
// slider style value (unused in logic) and is intentionally omitted (spec §3.4).
export const SCORECARD_ANSWER_OPTIONS: readonly ScorecardAnswerOption[] = [
  {
    id: 'volledig',
    label: 'Volledig van toepassing',
    short: 'Volledig',
    score: 4,
    percentage: 100,
  },
  {
    id: 'grotendeels',
    label: 'Grotendeels van toepassing',
    short: 'Grotendeels',
    score: 3,
    percentage: 60,
  },
  {
    id: 'gedeeltelijk',
    label: 'Gedeeltelijk van toepassing',
    short: 'Gedeeltelijk',
    score: 2,
    percentage: 30,
  },
  {
    id: 'niet',
    label: 'Niet van toepassing',
    short: 'Niet',
    score: 1,
    percentage: 0,
  },
  {
    id: 'nvt',
    label: 'N.v.t. / overslaan',
    short: 'N.v.t.',
    score: null,
    percentage: null,
  },
] as const

// Slider stops, left → right, index 0-3 (osago-bundle.js:7473-7478, 7549).
export const SCORECARD_SLIDER_ORDER = [
  'niet',
  'gedeeltelijk',
  'grotendeels',
  'volledig',
] as const

// Unanswered questions render the slider at "Gedeeltelijk" but stay uncounted
// until moved (osago-bundle.js:7481).
export const SCORECARD_UNANSWERED_SLIDER_INDEX = 1

export interface ScorecardImprovementPriority {
  label: string
  weight: number
}

// Verbeterrapport priority per answer (osago-bundle.js:7695-7699). The legacy
// `color` RGB triple is a jsPDF drawing value that lands with the deferred
// report builder (Slice 13); only label + weight are needed by the pure tree.
export const SCORECARD_IMPROVEMENT_PRIORITIES: Record<
  ScorecardImprovementPriorityId,
  ScorecardImprovementPriority
> = {
  niet: { label: 'Hoog', weight: 0 },
  gedeeltelijk: { label: 'Middel', weight: 30 },
  grotendeels: { label: 'Laag', weight: 60 },
}

// Sort order of verbeterpunten within a category: Hoog → Middel → Laag
// (osago-bundle.js:7700, 7707).
export const SCORECARD_IMPROVEMENT_PRIORITY_ORDER: readonly ScorecardImprovementPriorityId[] =
  ['niet', 'gedeeltelijk', 'grotendeels']
