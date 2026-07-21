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

export const computeValuationProgress = ({
  financials,
  hasValuationPdfInVault,
  valueDriverAnswers,
  valuationReport,
  valuationMade,
}: ComputeValuationProgressInput): ValuationProgress => {
  const financialsAnyValue = financials.some(row =>
    REQUIRED_FIN_KEYS.some(key => row[key] !== null),
  )

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
