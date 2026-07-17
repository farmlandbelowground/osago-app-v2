import { type Voucher } from '../../types'

export interface Props {
  onClose: () => void
  voucher: Voucher | null
}
