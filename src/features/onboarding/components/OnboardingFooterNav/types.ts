export interface Props {
  isStepComplete: boolean
  nextPath: string | null
  prevPath: string | null
  stepIndex: number
  completeHint?: string
}
