import { type PlanId } from '../../types'

export interface AppliedVoucher {
  code: string
  discount: number
  voucherId: string
}

export interface Props {
  onApplied: (voucher: AppliedVoucher) => void
  onCleared: () => void
  planId: PlanId
}
