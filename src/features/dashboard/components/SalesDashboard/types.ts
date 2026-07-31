import { type Lead } from '@features/leads'

export interface Props {
  companyHasName: boolean
  firstName: string | null
  isMedewerker: boolean
  leads: Lead[]
}
