import { ACTIVE_SUBSCRIPTION_STATUSES, PLANS } from '../constants'
import { type Subscription } from '../types'
import { subStatus } from './subStatus'

// Ports legacy's hasWerkruimteAccess = hasFullAccess (osago-bundle.js:3798) and
// the plan-category branch of getAllowedCustomerPages (:12703-12722): the
// werkruimte pages (kopermatching/verkoopproces) require a lopend subscription
// on a `full`-category plan. A valuation-only plan never gets them.
export const hasWerkruimteAccess = (
  subscription: Subscription | null,
): boolean => {
  if (!ACTIVE_SUBSCRIPTION_STATUSES.includes(subStatus(subscription).status)) {
    return false
  }

  const plan = PLANS.find(candidate => candidate.id === subscription?.type)

  return (plan?.category ?? 'full') === 'full'
}
