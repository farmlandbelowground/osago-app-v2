import { type Voucher } from '../types'
import { formatEuro } from './formatEuro'

// Ports legacy describeVoucher (osago-bundle.js:13279): a short "X% korting" /
// "€Y korting" label for a voucher. Uses v2's formatEuro so euro amounts read
// consistently with the rest of the voucher UI (legacy used fmtMoney).
export const describeVoucher = (voucher: Voucher): string =>
  voucher.type === 'percentage'
    ? `${voucher.value}% korting`
    : `${formatEuro(voucher.value)} korting`
