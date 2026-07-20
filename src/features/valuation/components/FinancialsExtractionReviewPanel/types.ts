import {
  type FinancialsExtraction,
  type FinancialYearInput,
} from '@features/valuation/types'

export interface Props {
  displayYears: number[]
  extraction: FinancialsExtraction
  onApply: (years: FinancialYearInput[]) => void
  onDismiss: () => void
}
