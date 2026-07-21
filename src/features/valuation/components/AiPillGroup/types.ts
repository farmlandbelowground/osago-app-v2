import { type ValuationReportField } from '@features/valuation/types'

export interface Props {
  currentValue: string
  field: ValuationReportField
  onResult: (text: string) => void
}
