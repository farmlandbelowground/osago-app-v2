import { type ReactNode } from 'react'

import { type ValuationReviewStatus } from '../../types'

export interface Props {
  children: ReactNode
  isMade: boolean
  isMedewerker: boolean
  requiresReview: boolean
  reviewStatus: ValuationReviewStatus
}
