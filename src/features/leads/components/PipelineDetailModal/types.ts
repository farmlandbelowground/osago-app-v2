import { type Lead } from '../../types'

export interface Props {
  companyHasName: boolean
  isMedewerker: boolean
  lead: Lead
  onClose: () => void
}
