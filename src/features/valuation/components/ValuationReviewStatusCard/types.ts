export type ValuationReviewStatus = 'none' | 'submitted' | 'approved'

export interface Props {
  requiresReview: boolean
  reviewStatus: ValuationReviewStatus
}
