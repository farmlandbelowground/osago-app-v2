import { type EmailTemplate } from '../../schema'

export interface Props {
  onSelect: (id: string) => void
  selectedId: string | null
  templates: EmailTemplate[]
}
