import { type FinancialYearInput } from '../types'

// Builds the per-year EBITDA weighting map the valuation engine consumes, from
// the persisted `financials.history_weight` values. Years without a stored
// weight are omitted, so the engine falls back to its default weighting for
// them. Mirrors legacy's `weightFor` reading `fin[year].historyWeight`.
export const buildHistoryWeightOverrides = (
  fin: Record<number, FinancialYearInput>,
): Record<number, number> => {
  const overrides: Record<number, number> = {}
  for (const row of Object.values(fin)) {
    if (row.historyWeight != null) {
      overrides[row.year] = row.historyWeight
    }
  }
  return overrides
}
