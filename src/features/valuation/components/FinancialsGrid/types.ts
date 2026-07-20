import {
  type DcfAdminDefaults,
  type DcfNewInputs,
  type FinancialYearInput,
  type NonLegalEntityValuation,
  type Normalization,
  type ValuationSettings,
} from '@features/valuation/types'

export interface PendingExtractionApply {
  token: number
  years: FinancialYearInput[]
}

export interface Props {
  autoForecastDefault: boolean
  dcfAdminDefaults: DcfAdminDefaults
  dcfInputs: DcfNewInputs
  initialYears: FinancialYearInput[]
  lastClosedYear: number
  nonLegalEntity: NonLegalEntityValuation
  normalizations: Normalization[]
  onDcfInputsChange: (next: DcfNewInputs) => void
  sectorMultiple: number | null
  valuationSettings: ValuationSettings
  extractionApply?: PendingExtractionApply | null
  onLastClosedYearChange?: (year: number) => void
}
