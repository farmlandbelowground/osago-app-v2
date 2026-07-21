import { type ReactNode } from 'react'

import { type Result as GammaGenerationState } from '../../useGammaGeneration/types'

export interface Props {
  doneDescription: ReactNode
  gamma: GammaGenerationState
  onClose: () => void
  titleNoun: string
  busyOverride?: boolean
}
