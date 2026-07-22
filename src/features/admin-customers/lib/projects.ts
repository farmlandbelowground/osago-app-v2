import { getAllowedCustomerPages } from '@features/subscriptions/lib/customerAccess'
import { type Subscription } from '@features/subscriptions/types'

import {
  PROJECT_ID_PAD,
  PROJECT_ID_PREFIX,
  PROJECT_TYPE_VERKOOP,
  PROJECT_TYPE_WAARDEBEPALING,
} from '../constants'
import { type ProjectType } from '../types'

const WAARDEBEPALING_PATH = '/waardebepaling'
const PROJECT_ID_PATTERN = /^P(\d+)$/

// Ports nextProjectId (osago-bundle.js:1254): highest existing P###### + 1.
export const nextProjectId = (existingIds: string[]): string => {
  let highest = 0

  for (const id of existingIds) {
    const match = PROJECT_ID_PATTERN.exec(id)
    if (match) {
      highest = Math.max(highest, parseInt(match[1], 10))
    }
  }

  return (
    PROJECT_ID_PREFIX + String(highest + 1).padStart(PROJECT_ID_PAD, '0')
  )
}

// Ports deriveProjectTypeForUser (osago-bundle.js:1267): full plan → 'verkoop';
// valuation access → 'waardebepaling'; else the stored type. getAllowedCustomer-
// Pages returns null for a lopend full plan, the restricted set otherwise.
export const deriveProjectTypeForUser = (
  subscription: Subscription | null,
  storedType: string | null,
): ProjectType => {
  const allowed = getAllowedCustomerPages(subscription)

  if (allowed === null) {
    return PROJECT_TYPE_VERKOOP
  }
  if (allowed.includes(WAARDEBEPALING_PATH)) {
    return PROJECT_TYPE_WAARDEBEPALING
  }

  return storedType === PROJECT_TYPE_WAARDEBEPALING
    ? PROJECT_TYPE_WAARDEBEPALING
    : PROJECT_TYPE_VERKOOP
}

// A customer gets a project once their subscription grants any valuation/full
// access — ports ensureProjectsForUser's hasAnyAccess gate (osago-bundle.js:1293).
export const isProjectEligible = (subscription: Subscription | null): boolean => {
  const allowed = getAllowedCustomerPages(subscription)
  return allowed === null || allowed.includes(WAARDEBEPALING_PATH)
}
