import { type FinancialsExtraction } from '@features/valuation/types'

export interface Props {
  onExtracted: (extraction: FinancialsExtraction) => void
}
