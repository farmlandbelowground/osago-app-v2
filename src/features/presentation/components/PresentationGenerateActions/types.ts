import { type PresentationReviewStatus } from '../../types'

export interface Props {
  anonDone: boolean
  memoDone: boolean
  reviewRequired: boolean
  reviewStatus: PresentationReviewStatus
}
