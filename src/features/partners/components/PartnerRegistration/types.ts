import { type Voucher } from '@features/subscriptions/types'

import { type Partner } from '../../types'

export interface Props {
  partner: Partner
  voucher: Voucher | null
}
