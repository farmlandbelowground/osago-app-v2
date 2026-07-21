import { type ReportSectionDefinition } from '@features/valuation/constants/valuationReport'

export interface Props {
  initialValue: string
  isFirst: boolean
  section: ReportSectionDefinition
}
