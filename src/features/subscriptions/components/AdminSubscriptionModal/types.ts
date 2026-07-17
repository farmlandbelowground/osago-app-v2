import {
  type AdminSubscriptionRow,
  type CustomerSelectOption,
} from '../../types'

export interface Props {
  customers: CustomerSelectOption[]
  onClose: () => void
  subscription: AdminSubscriptionRow | null
}
