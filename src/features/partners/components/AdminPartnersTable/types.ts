import { type Voucher } from '@features/subscriptions/types'

import { type Partner } from '../../types'

export interface Props {
  partners: Partner[]
  referralCounts: Record<string, number>
  vouchers: Voucher[]
}
