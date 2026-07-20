import { DCF_GROEIREST_PHASES } from '@features/valuation/constants/dcf'

export const DCF_KLEIN_RANGE = { max: 2, min: 1, step: 0.05 } as const
export const DCF_ASSET_RANGE = { max: 1, min: 0, step: 0.05 } as const

// The "Vermogensvoet rest periode" slider works in whole-percent units
// (15%–30%); the value persisted on the inputs is the decimal (0.15–0.30).
export const DCF_VERMOGENSVOET_REST_PCT_RANGE = {
  max: 30,
  min: 15,
  step: 1,
} as const

export const DCF_KLEIN_FIELDS = [
  { key: 'adh', label: 'Afhankelijkheid aandeelhouders' },
  { key: 'afn', label: 'Afhankelijkheid afnemers' },
  { key: 'alr', label: 'Afhankelijkheid leveranciers' },
] as const

export const DCF_ASSET_FIELDS = [
  { key: 'rep', label: 'Merknaam en reputatie' },
  { key: 'act', label: 'Spreiding van de activiteiten' },
  { key: 'toetr', label: 'Toetreding tot de markt' },
  { key: 'trackR', label: 'Track record' },
] as const

export type DcfKleinFieldKey = (typeof DCF_KLEIN_FIELDS)[number]['key']
export type DcfAssetFieldKey = (typeof DCF_ASSET_FIELDS)[number]['key']

interface GroeiRestOption {
  label: string
  value: number
}

export const DCF_GROEIREST_OPTIONS: readonly GroeiRestOption[] = [
  {
    label: 'Start-/ontwikkelingsfase',
    value: DCF_GROEIREST_PHASES.startOntwikkeling,
  },
  { label: 'Groeifase', value: DCF_GROEIREST_PHASES.groei },
  { label: 'Stabiele fase', value: DCF_GROEIREST_PHASES.stabiel },
  { label: 'Teruggangsfase', value: DCF_GROEIREST_PHASES.teruggang },
]
