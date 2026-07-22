import { type ScorecardAnswerId, type ScorecardState } from '../../schema'
import { type ScorecardCategory, type ScorecardTabStats } from '../../types'

export interface Props {
  activeStats: ScorecardTabStats
  category: ScorecardCategory
  onAnswer: (questionId: string, answer: ScorecardAnswerId | null) => void
  startIndex: number
  state: ScorecardState
}
