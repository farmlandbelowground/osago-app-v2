import { type UseFormReturn } from 'react-hook-form'

import { type CompanyProfileInput } from '@features/company/schema'
import { type SectorOption } from '@features/company/types'

export interface Props {
  form: UseFormReturn<CompanyProfileInput>
  kvkPrefilled: string[]
  logo: string | null
  onSubmit: (data: CompanyProfileInput) => Promise<void>
  sectorOptions: SectorOption[]
}
