import { type BuyerPipelineCounts } from '@features/leads'
import { type DashboardValuation } from '@features/valuation'

export interface Props {
  counts: BuyerPipelineCounts
  hasWerkruimteAccess: boolean
  valuation: DashboardValuation | null
}
