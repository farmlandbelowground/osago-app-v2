import { type Voucher, type VoucherStatus } from '../types'

export const voucherStatus = (voucher: Voucher): VoucherStatus => {
  if (!voucher.active) {
    return 'deactivated'
  }

  const now = Date.now()

  if (voucher.validUntil && now > new Date(voucher.validUntil).getTime()) {
    return 'expired'
  }

  if (voucher.validFrom && now < new Date(voucher.validFrom).getTime()) {
    return 'notYetValid'
  }

  if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses) {
    return 'depleted'
  }

  return 'active'
}
