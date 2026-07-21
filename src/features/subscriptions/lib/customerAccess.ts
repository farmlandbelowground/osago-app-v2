import {
  ABONNEMENT_AFSLUITEN_PATH,
  ACCOUNT_PATH,
  ACTIVE_SUBSCRIPTION_STATUSES,
  PLANS,
  RESTRICTED_ALLOWED_PATHS,
  VALUATION_ALLOWED_PATHS,
} from '../constants'
import { type LockReason, type Subscription } from '../types'
import { subStatus } from './subStatus'

const DASHBOARD_PATH = '/dashboard'
const WAARDEBEPALING_PATH = '/waardebepaling'
const MIJN_BEDRIJF_PATH = '/mijn-bedrijf'

// Ports getAllowedCustomerPages (osago-bundle.js:12703-12722): `null` = the
// customer's plan grants every page (a lopend full plan); otherwise the explicit
// list of allowed route paths.
export const getAllowedCustomerPages = (
  subscription: Subscription | null,
): string[] | null => {
  const isLopend = ACTIVE_SUBSCRIPTION_STATUSES.includes(
    subStatus(subscription).status,
  )
  if (!isLopend) {
    return [...RESTRICTED_ALLOWED_PATHS]
  }

  const plan = PLANS.find(candidate => candidate.id === subscription?.type)
  const category = plan?.category ?? 'full'

  if (category === 'valuation') {
    return [...VALUATION_ALLOWED_PATHS]
  }

  return null
}

// Ports isCustomerPageAllowed (osago-bundle.js:12724-12728). Onboarding paths are
// always allowed (they live in a separate route group, but kept for parity).
export const isCustomerPageAllowed = (
  path: string,
  allowed: string[] | null,
): boolean => {
  if (!allowed) {
    return true
  }
  if (path.startsWith('/welkom')) {
    return true
  }
  return allowed.includes(path)
}

// Ports firstAllowedCustomerPage (osago-bundle.js:12730-12735) — the fallback a
// blocked customer is redirected to.
export const firstAllowedCustomerPage = (allowed: string[] | null): string => {
  if (!allowed) {
    return DASHBOARD_PATH
  }
  if (allowed.includes(DASHBOARD_PATH)) {
    return DASHBOARD_PATH
  }
  if (allowed.includes(WAARDEBEPALING_PATH)) {
    return WAARDEBEPALING_PATH
  }
  return MIJN_BEDRIJF_PATH
}

// Ports the lock branch of navigate() (osago-bundle.js:3021-3023): which paths a
// locked customer may still reach. Overdue → only /account; expired → /account
// and /abonnement-afsluiten (so the plan-picker/Mollie flow stays reachable).
export const lockPermitsPath = (
  lockReason: LockReason,
  path: string,
): boolean => {
  if (!lockReason) {
    return true
  }
  if (lockReason === 'expired') {
    return path === ACCOUNT_PATH || path === ABONNEMENT_AFSLUITEN_PATH
  }
  return path === ACCOUNT_PATH
}
