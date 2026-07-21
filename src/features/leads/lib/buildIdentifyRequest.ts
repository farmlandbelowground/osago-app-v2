import { type Company } from '@features/company/types'

export interface IdentifyRequestCompany {
  city: string
  description: string
  name: string
  region: string
  sector: string
}

// Ports the request body of startAutoLeadIdentification (osago-bundle.js:21174-21180).
// OQ-7: `region` is sent identical to `city`, byte-for-byte as legacy.
export const buildIdentifyRequest = (
  company: Company,
): { company: IdentifyRequestCompany } => ({
  company: {
    city: company.city || '',
    description: company.description || company.usp || '',
    name: company.name || '',
    region: company.city || '',
    sector: company.sector || '',
  },
})
