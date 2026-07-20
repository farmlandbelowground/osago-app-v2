import {
  type DcfAdminDefaults,
  type DcfNewInputs,
  type FinancialYearInput,
  type NonLegalEntityValuation,
  type Normalization,
  type ShareholderValueInputs,
  type ValuationMultiple,
  type ValuationSettings,
} from '@features/valuation/types'

export interface Props {
  autoForecastDefault: boolean
  bedrijfMarktOntwikkeling: number | null
  dcfAdminDefaults: DcfAdminDefaults
  dcfNewInputs: DcfNewInputs
  initialYears: FinancialYearInput[]
  lastClosedYear: number
  legalForm: string
  nonLegalEntityDefault: NonLegalEntityValuation | null
  normalizations: Normalization[]
  sector: string
  shareholderValue: ShareholderValueInputs
  valuationMultiples: ValuationMultiple[]
  valuationSettings: ValuationSettings
}
