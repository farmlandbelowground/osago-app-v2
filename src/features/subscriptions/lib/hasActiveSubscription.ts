import { ACTIVE_SUBSCRIPTION_STATUSES } from '../constants'
import { type Subscription } from '../types'
import { subStatus } from './subStatus'

// The lopend-subscription check the documentenkluis gate uses — both plan
// categories are allowed (documentenkluis is in the valuation allow-set at
// osago-bundle.js:12718), so only the status matters, not the plan category.
export const hasActiveSubscription = (
  subscription: Subscription | null,
): boolean =>
  ACTIVE_SUBSCRIPTION_STATUSES.includes(subStatus(subscription).status)
