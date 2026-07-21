import { type ReactNode } from 'react'

import { type ValuationReportContent } from '@features/valuation/types'

export interface Props {
  content: ValuationReportContent
  footer?: ReactNode
  headerActions?: ReactNode
}
