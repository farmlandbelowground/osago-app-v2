import { type Lead } from '../../types'

export interface Props {
  companyHasName: boolean
  lead: Lead
  onClose: () => void
}
