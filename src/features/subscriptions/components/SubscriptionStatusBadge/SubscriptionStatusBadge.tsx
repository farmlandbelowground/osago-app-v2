import { type FC } from 'react'

import { cn } from '@shared/utils/cn'

import {
  BADGE_KIND_CLASSES,
  BADGE_SHAPE_CLASSES,
  SUBSCRIPTION_STATUS_KIND,
  SUBSCRIPTION_STATUS_LABELS,
} from '../../constants'
import { type Props } from './types'

export const SubscriptionStatusBadge: FC<Props> = ({ status }) => {
  return (
    <span
      className={cn(
        BADGE_SHAPE_CLASSES,
        BADGE_KIND_CLASSES[SUBSCRIPTION_STATUS_KIND[status]],
      )}
    >
      {SUBSCRIPTION_STATUS_LABELS[status]}
    </span>
  )
}
