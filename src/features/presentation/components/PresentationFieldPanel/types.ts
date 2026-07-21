import { type PresentationPhoto, type PresentationTab } from '../../types'

export interface Props {
  initialValues: Record<string, string>
  photos: PresentationPhoto[]
  tab: PresentationTab
}
