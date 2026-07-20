import { type FinancialYearInput } from '../types'
import { computeRevenueCagr } from './computeRevenueCagr'
import { deriveFinRow } from './deriveFinRow'

const NO_ADDON = { operatingExpensesAddon: 0, normalizationsAddon: 0 }

const RATIO_KEYS = [
  'cogs',
  'operatingExpenses',
  'depreciation',
  'interest',
] as const

const averageRatio = (
  key: (typeof RATIO_KEYS)[number],
  historicalYears: number[],
  fin: Record<number, FinancialYearInput>,
): number | undefined => {
  const ratios: number[] = []
  for (const year of historicalYears) {
    const row = fin[year]
    const revenue = row?.revenue ?? null
    const value = row?.[key] ?? null
    if (revenue !== null && revenue !== 0 && value !== null) {
      ratios.push(value / revenue)
    }
  }
  return ratios.length > 0
    ? ratios.reduce((a, b) => a + b, 0) / ratios.length
    : undefined
}

export const computeAutoForecast = (
  displayYears: number[],
  lastClosedYear: number,
  fin: Record<number, FinancialYearInput>,
): Record<number, Partial<FinancialYearInput>> => {
  const historicalYears = displayYears
    .filter(year => year <= lastClosedYear)
    .sort((a, b) => a - b)
  const forecastYears = displayYears
    .filter(year => year > lastClosedYear)
    .sort((a, b) => a - b)

  const cagr = computeRevenueCagr(
    historicalYears
      .map(year => ({ year, revenue: fin[year]?.revenue ?? null }))
      .filter(
        (point): point is { year: number; revenue: number } =>
          point.revenue !== null,
      ),
  )
  if (cagr === null) {
    return {}
  }

  let baselineYear: number | null = null
  for (const year of [...historicalYears].reverse()) {
    const revenue = fin[year]?.revenue ?? null
    if (revenue !== null && revenue > 0) {
      baselineYear = year
      break
    }
  }
  if (baselineYear === null) {
    return {}
  }
  const baselineRevenue = fin[baselineYear].revenue ?? 0

  const ratios = RATIO_KEYS.reduce<
    Partial<Record<(typeof RATIO_KEYS)[number], number>>
  >((acc, key) => {
    const ratio = averageRatio(key, historicalYears, fin)
    if (ratio !== undefined) {
      acc[key] = ratio
    }
    return acc
  }, {})

  let effectiveTaxRate: number | null = null
  const taxRateSamples: number[] = []
  for (const year of historicalYears) {
    const row = fin[year]
    if (!row) {
      continue
    }
    const pbt = deriveFinRow(row, NO_ADDON).profitBeforeTax
    const tax = row.taxesPaid
    if (pbt !== null && pbt > 0 && tax !== null) {
      taxRateSamples.push(tax / pbt)
    }
  }
  if (taxRateSamples.length > 0) {
    effectiveTaxRate =
      taxRateSamples.reduce((a, b) => a + b, 0) / taxRateSamples.length
  }

  const out: Record<number, Partial<FinancialYearInput>> = {}
  for (const year of forecastYears) {
    const yearsAhead = year - baselineYear
    const revenue = baselineRevenue * Math.pow(1 + cagr, yearsAhead)
    const row: Partial<FinancialYearInput> = { revenue: Math.round(revenue) }

    for (const key of RATIO_KEYS) {
      const ratio = ratios[key]
      if (ratio !== undefined) {
        row[key] = Math.round(revenue * ratio)
      }
    }

    if (effectiveTaxRate !== null) {
      const projectedPbt = deriveFinRow(
        {
          year,
          revenue: row.revenue ?? null,
          cogs: row.cogs ?? null,
          operatingExpenses: row.operatingExpenses ?? null,
          depreciation: row.depreciation ?? null,
          interest: row.interest ?? null,
          taxesPaid: null,
        },
        NO_ADDON,
      ).profitBeforeTax
      row.taxesPaid =
        projectedPbt !== null && projectedPbt > 0
          ? Math.round(projectedPbt * effectiveTaxRate)
          : 0
    }

    out[year] = row
  }

  return out
}
