import { type PreviewMode } from '../../types'

export interface Props {
  bcc: string | null
  fromEmail: string
  fromName: string
  html: string
  mode: PreviewMode
  onModeChange: (mode: PreviewMode) => void
  subject: string
  text: string
}
