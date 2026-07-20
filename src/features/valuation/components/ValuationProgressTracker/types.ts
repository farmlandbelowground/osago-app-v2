import { type ValuationProgress } from '@features/valuation/types'

export interface Props {
  progress: ValuationProgress
}

export interface ProgressStepDefinition {
  label: string
  progressKey: keyof ValuationProgress
}
