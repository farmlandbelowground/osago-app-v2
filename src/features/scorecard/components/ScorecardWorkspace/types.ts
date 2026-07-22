import { type ScorecardState } from '../../schema'
import { type ScorecardCompanyInput } from '../../types'

export interface Props {
  company: ScorecardCompanyInput
  initialState: ScorecardState
  reportInVault: boolean
}
