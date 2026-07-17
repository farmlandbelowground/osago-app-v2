import { type CustomerSelectOption } from '../../types'

export interface Props {
  customers: CustomerSelectOption[]
  onClose: () => void
}
