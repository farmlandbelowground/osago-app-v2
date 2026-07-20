import { type ReactNode } from 'react'

export interface Props {
  children: ReactNode
  isStepComplete: boolean
  stepIndex: number
  completeHint?: string
}
