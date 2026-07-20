import { type Company, type SectorOption } from '@features/company/types'

export interface Props {
  company: Company | null
  firstName: string | null
  sectorOptions: SectorOption[]
  onboardingNextPath?: string
}

export interface KvkLinkState {
  kvkNummer: string | null
  kvkPrefilled: string[]
  vestigingsnummer: string | null
}
