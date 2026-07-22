import { type ScorecardAnswerId, type ScorecardState } from '../../schema'
import { type ScorecardCategory, type ScorecardStats } from '../../types'

export interface UseScorecardParams {
  categories: ScorecardCategory[]
  initialState: ScorecardState
}

export interface UseScorecard {
  setAnswer: (questionId: string, answer: ScorecardAnswerId | null) => void
  state: ScorecardState
  stats: ScorecardStats
}
