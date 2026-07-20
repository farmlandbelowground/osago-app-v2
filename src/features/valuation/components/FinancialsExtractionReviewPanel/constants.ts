import { type FinancialsExtraction } from '@features/valuation/types'

export const CONFIDENCE_BADGE_CLASS: Record<
  FinancialsExtraction['confidence'],
  string
> = {
  gemiddeld: 'badge-amber',
  hoog: 'badge-green',
  laag: 'badge-red',
}

export const CONFIDENCE_LABEL: Record<
  FinancialsExtraction['confidence'],
  string
> = {
  gemiddeld: 'Gemiddeld',
  hoog: 'Hoog',
  laag: 'Laag',
}
