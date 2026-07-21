import { type GammaGenerationState } from '@shared/gamma'

import { type PresentationGenerateVariant } from '../../types'

export interface Props {
  gamma: GammaGenerationState
  onClose: () => void
  variant: PresentationGenerateVariant
}
