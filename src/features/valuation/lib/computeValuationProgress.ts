import { VALUE_DRIVER_QUESTION_COUNT } from '../constants/valueDrivers'
import {
  type FinancialYearInput,
  type ValuationProgress,
  type ValuationReportPresence,
  type ValueDriverAnswers,
} from '../types'

const REQUIRED_FIN_KEYS = [
  'revenue',
  'cogs',
  'operatingExpenses',
  'depreciation',
  'interest',
  'taxesPaid',
] as const

const REPORT_KEYS = [
  'foreword',
  'financialsNote',
  'valueDriversNote',
  'closing',
] as const

interface ComputeValuationProgressInput {
  financials: FinancialYearInput[]
  hasValuationPdfInVault: boolean
  valuationMade: boolean
  valuationReport: ValuationReportPresence | null
  valueDriverAnswers: ValueDriverAnswers
}

// Exposed on its own because /waardebepaling's missing-data gate needs only
// this check, without the document and report lookups the full progress object
// would otherwise require.
export const hasAnyFinancialValue = (
  financials: FinancialYearInput[],
): boolean =>
  financials.some(row => REQUIRED_FIN_KEYS.some(key => row[key] !== null))

export const computeValuationProgress = ({
  financials,
  hasValuationPdfInVault,
  valueDriverAnswers,
  valuationReport,
  valuationMade,
}: ComputeValuationProgressInput): ValuationProgress => {
  const financialsAnyValue = hasAnyFinancialValue(financials)

  const valueDriversComplete = Array.from(
    { length: VALUE_DRIVER_QUESTION_COUNT },
    (_, index) => `q${index + 1}` as const,
  ).every(key => valueDriverAnswers[key] !== undefined)

  const valuationReportStarted = valuationReport
    ? REPORT_KEYS.some(key => (valuationReport[key] ?? '').trim() !== '')
    : false

  return {
    financialsAnyValue,
    valueDriversComplete,
    valuationReportStarted,
    valuationMade,
    hasValuationPdfInVault,
  }
}
