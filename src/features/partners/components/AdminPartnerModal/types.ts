import { type Voucher } from '@features/subscriptions/types'

import { type Partner } from '../../types'

export interface Props {
  onClose: () => void
  partner: Partner | null
  vouchers: Voucher[]
}
