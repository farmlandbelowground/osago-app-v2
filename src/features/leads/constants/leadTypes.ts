// Per-source default fit scores when a lead has none (osago-bundle.js:21118,
// 20651, 20943 → auto 60 / manual 70 / osago 80).
export const AUTO_LEAD_FIT_DEFAULT = 60
export const MANUAL_LEAD_FIT_DEFAULT = 70
export const OSAGO_LEAD_FIT_DEFAULT = 80

// Default type for an AI-identified buyer with no type (osago-bundle.js:21197).
export const IDENTIFIED_BUYER_DEFAULT_TYPE = 'Potentiële koper'

// Buyer-type <select> options in the add-buyer modal (osago-bundle.js:23104-23107).
export const BUYER_TYPE_OPTIONS: readonly string[] = [
  'Strategische koper',
  'PE-investeerder',
  'Family Office',
  'MBI/MBO kandidaat',
]
