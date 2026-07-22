import {
  type DcfAdminDefaults,
  type EbitdaDeductionRange,
  type OrgDeductionRange,
  type ValuationMultiple,
} from '../../../types'

export interface Props {
  dcfDefaults: DcfAdminDefaults
  ebitdaDeductions: EbitdaDeductionRange[]
  multiples: ValuationMultiple[]
  orgDeductions: OrgDeductionRange[]
}
