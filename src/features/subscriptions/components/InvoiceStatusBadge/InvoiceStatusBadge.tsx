import { type FC } from 'react'

import { cn } from '@shared/utils/cn'

import { BADGE_KIND_CLASSES, BADGE_SHAPE_CLASSES } from '../../constants'
import { invoiceStatusBadge } from '../../lib/invoiceStatusBadge'
import { type Props } from './types'

export const InvoiceStatusBadge: FC<Props> = ({ invoice }) => {
  const badge = invoiceStatusBadge(invoice)

  return (
    <span className={cn(BADGE_SHAPE_CLASSES, BADGE_KIND_CLASSES[badge.kind])}>
      {badge.label}
    </span>
  )
}
