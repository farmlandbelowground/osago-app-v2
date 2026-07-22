import { type Voucher } from '@features/subscriptions/types'

import { type Partner } from '../../types'

export interface Props {
  partners: Partner[]
  vouchers: Voucher[]
}
