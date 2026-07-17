import { CENTS_PER_UNIT } from '../constants'
import { type Voucher } from '../types'

const roundToCents = (value: number): number =>
  Math.round(value * CENTS_PER_UNIT) / CENTS_PER_UNIT

// Ports legacy's calculateVoucherDiscount() (osago-bundle.js:13266)
// verbatim as typed logic — rounds to cents, then clamps to [0, priceNet].
export const voucherDiscount = (
  voucher: Pick<Voucher, 'type' | 'value'> | null,
  priceNet: number,
): number => {
  if (!voucher) {
    return 0
  }

  const rawDiscount =
    voucher.type === 'percentage'
      ? (priceNet * voucher.value) / CENTS_PER_UNIT
      : voucher.value

  const discount = roundToCents(rawDiscount)

  return Math.min(Math.max(discount, 0), priceNet)
}
