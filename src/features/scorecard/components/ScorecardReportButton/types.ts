import { type ScorecardState } from '../../schema'
import { type ScorecardCategory } from '../../types'

export interface Props {
  categories: ScorecardCategory[]
  companyName: string
  reportInVault: boolean
  sector: string | null
  state: ScorecardState
  verbeterCount: number
}
