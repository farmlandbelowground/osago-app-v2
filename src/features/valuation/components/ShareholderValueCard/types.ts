import {
  type FinancialYearInput,
  type ShareholderValueInputs,
} from '@features/valuation/types'

export interface Props {
  financials: Record<number, FinancialYearInput>
  initialValue: ShareholderValueInputs
  lastClosedYear: number
}
