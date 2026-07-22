import { type ScorecardAnswerId } from '../../schema'
import { type ScorecardItem } from '../../types'

export interface Props {
  answer: ScorecardAnswerId | undefined
  item: ScorecardItem
  number: number
  onAnswer: (answer: ScorecardAnswerId | null) => void
}
