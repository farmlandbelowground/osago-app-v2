import { type PresentationPhoto } from '../../types'

export interface Props {
  onClose: () => void
  onConfirm: (photos: PresentationPhoto[]) => void
}
