import { NON_LEGAL_ENTITY_HOURLY_RATE } from '../constants/financials'
import { type NonLegalEntityValuation } from '../types'

export const computeNonLegalEntityAddon = (
  config: NonLegalEntityValuation | null,
): number => {
  if (!config || config.hasFixedIncome !== false) {
    return 0
  }

  const hours = config.hoursPerWeek ?? NaN
  if (isNaN(hours) || hours <= 0) {
    return 0
  }

  const partnerCount = Math.max(1, Math.trunc(config.partnerCount ?? 1) || 1)

  return Math.round(hours * NON_LEGAL_ENTITY_HOURLY_RATE * partnerCount)
}
