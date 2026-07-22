export const PERCENT_MULTIPLIER = 100
export const SCORE_MAX_LABEL = '4,0'
export const SLIDER_MIN = 0
export const SLIDER_MAX = 3

// The four discrete slider stop positions, left → right (osago-bundle.js:7482).
export const SLIDER_POSITIONS = [0, 33.33, 66.67, 100] as const

export const SLIDER_LABELS = [
  'Niet',
  'Gedeeltelijk',
  'Grotendeels',
  'Volledig',
] as const

export const RATING_WEIGHTS_META =
  'weging: niet 0% · gedeeltelijk 30% · grotendeels 60% · volledig 100%'
