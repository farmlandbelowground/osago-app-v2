import { DAY_MS, SUBSCRIPTION_RENEW_NOTICE_DAYS } from '../constants'
import { type Subscription, type SubStatusResult } from '../types'
import { toDateOnly } from './toDateOnly'

// Ports legacy's subStatus() (osago-bundle.js:12684) verbatim as typed logic.
// `daysUntilCancel` rides along with the same `now` read here so consumer
// React components never need to call Date.now() during render themselves.
export const subStatus = (
  subscription: Subscription | null,
): SubStatusResult => {
  if (!subscription?.endDate) {
    return { cancelDate: null, daysUntilCancel: null, status: 'none' }
  }

  const endDateMs = new Date(subscription.endDate).getTime()
  const cancelDateMs = endDateMs - SUBSCRIPTION_RENEW_NOTICE_DAYS * DAY_MS
  const cancelDate = toDateOnly(new Date(cancelDateMs))
  const now = Date.now()
  const daysUntilCancel = Math.ceil((cancelDateMs - now) / DAY_MS)

  if (now > endDateMs) {
    return {
      cancelDate,
      daysUntilCancel,
      status: subscription.autoRenew ? 'renewed' : 'expired',
    }
  }

  if (now >= cancelDateMs && !subscription.autoRenew) {
    return { cancelDate, daysUntilCancel, status: 'ending' }
  }

  return { cancelDate, daysUntilCancel, status: 'active' }
}
