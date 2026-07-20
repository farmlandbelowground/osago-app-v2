import { type IndicativeEnterpriseValueResult } from '@features/valuation/types'

export interface Props {
  ashHigh: number
  ashLow: number
  bandHigh: number
  bandLow: number
  enterpriseValue: number
  indicativeResult: IndicativeEnterpriseValueResult
  shareholderValue: number
}
