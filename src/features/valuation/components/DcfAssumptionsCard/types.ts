import {
  type DcfAdminDefaults,
  type DcfNewInputs,
} from '@features/valuation/types'

export interface Props {
  adminDefaults: DcfAdminDefaults
  bedrijfMarktOntwikkeling: number | null
  dcfInputs: DcfNewInputs
  lastClosedYear: number
  onChange: (next: DcfNewInputs) => void
  sectorMultiple: number | null
}
