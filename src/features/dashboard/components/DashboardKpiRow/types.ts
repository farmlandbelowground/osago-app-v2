import { type BuyerPipelineCounts } from '@features/leads'

export interface Props {
  counts: BuyerPipelineCounts
  estimatedValue: number | null
  hasWerkruimteAccess: boolean
}
