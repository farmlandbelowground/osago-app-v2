import { type DcfNewComputeResult } from '@features/valuation/types'

export interface Props {
  ashHigh: number
  ashLow: number
  bandHigh: number
  bandLow: number
  dcfResult: DcfNewComputeResult
  enterpriseValue: number
  shareholderValue: number
}
