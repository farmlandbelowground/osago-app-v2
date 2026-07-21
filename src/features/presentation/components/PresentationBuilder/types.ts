import {
  type PresentationData,
  type PresentationPrefillSource,
} from '../../types'

export interface Props {
  data: PresentationData
  prefill: Record<PresentationPrefillSource, string>
}
