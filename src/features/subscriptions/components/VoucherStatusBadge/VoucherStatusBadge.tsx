import { type FC } from 'react'

import { cn } from '@shared/utils/cn'

import {
  BADGE_KIND_CLASSES,
  BADGE_SHAPE_CLASSES,
  VOUCHER_STATUS_KIND,
  VOUCHER_STATUS_LABELS,
} from '../../constants'
import { voucherStatus } from '../../lib/voucherStatus'
import { type Props } from './types'

export const VoucherStatusBadge: FC<Props> = ({ voucher }) => {
  const status = voucherStatus(voucher)

  return (
    <span
      className={cn(
        BADGE_SHAPE_CLASSES,
        BADGE_KIND_CLASSES[VOUCHER_STATUS_KIND[status]],
      )}
    >
      {VOUCHER_STATUS_LABELS[status]}
    </span>
  )
}
