export interface ScorecardRatingThreshold {
  label: string
  min: number
}

// Verkoopklaar-rating label cutoffs, checked high → low against overallPct
// (osago-bundle.js:7360-7364). The zero-rated edge maps to the separate
// "not assessed" label below (spec §3.5).
export const SCORECARD_RATING_THRESHOLDS: readonly ScorecardRatingThreshold[] =
  [
    { min: 80, label: 'Verkoopklaar' },
    { min: 60, label: 'Grotendeels verkoopklaar' },
    { min: 30, label: 'Aandacht nodig' },
    { min: 0, label: 'Veel verbeterpunten' },
  ] as const

export const SCORECARD_RATING_NOT_ASSESSED_LABEL = 'Nog niet beoordeeld'
