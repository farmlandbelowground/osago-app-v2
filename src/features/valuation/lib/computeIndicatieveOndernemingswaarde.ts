import {
  EBITDA_FORECAST_YEAR_COUNT,
  EBITDA_YEAR_WEIGHTS_DEFAULT,
} from '../constants/sectorMultiples'
import {
  type EbitdaDeductionRange,
  type EbitdaYearPoint,
  type FinancialYearInput,
  type IndicativeEnterpriseValueResult,
  type NonLegalEntityValuation,
  type Normalization,
  type OrgDeductionRange,
  type ValuationMultiple,
  type ValuationSettings,
} from '../types'
import { computeNonLegalEntityAddon } from './computeNonLegalEntityAddon'
import { computeNormalizationsForYear } from './computeNormalizationsForYear'
import { deriveFinRow } from './deriveFinRow'

interface ComputeIndicativeEnterpriseValueInput {
  employees: number | null
  fin: Record<number, FinancialYearInput>
  historyWeightOverrides: Record<number, number>
  lastClosedYear: number
  nonLegalEntityConfig: NonLegalEntityValuation | null
  normalizations: Normalization[]
  sector: string
  smallEbitdaDeductions: EbitdaDeductionRange[]
  smallOrgDeductions: OrgDeductionRange[]
  valuationMultiples: ValuationMultiple[]
  valuationSettings: ValuationSettings
}

const inRange = (
  value: number | null,
  from: number | null,
  to: number | null,
): boolean => {
  if (value === null || isNaN(value)) {
    return false
  }
  if (from === null && to === null) {
    return false
  }
  if (from !== null && value < from) {
    return false
  }
  if (to !== null && value > to) {
    return false
  }
  return true
}

export const computeIndicatieveOndernemingswaarde = ({
  fin,
  lastClosedYear,
  valuationSettings,
  historyWeightOverrides,
  nonLegalEntityConfig,
  normalizations,
  sector,
  employees,
  valuationMultiples,
  smallEbitdaDeductions,
  smallOrgDeductions,
}: ComputeIndicativeEnterpriseValueInput): IndicativeEnterpriseValueResult => {
  const result: IndicativeEnterpriseValueResult = {
    value: null,
    ebitdaSource: null,
    ebitdaPerYear: [],
    ebitdaUsed: null,
    ebitdaUsedFallback: false,
    sectorLabel: null,
    sectorMultipleRaw: null,
    smallEbitdaApplied: null,
    smallOrgApplied: null,
    sectorMultipleAdjusted: null,
    valuationSettings: {
      historyIncluded: valuationSettings.historyIncluded,
      adjustHistoryWeights: valuationSettings.adjustHistoryWeights,
      forecastIncluded: valuationSettings.forecastIncluded,
    },
    error: null,
  }

  const nonLegalEntityAddon = computeNonLegalEntityAddon(nonLegalEntityConfig)
  result.nonLegalEntityAddon = nonLegalEntityAddon
  result.normalizationsPerYear = {}

  const extrasFor = (year: number) => {
    const norm = computeNormalizationsForYear(normalizations, year)
    result.normalizationsPerYear![year] = norm
    return {
      operatingExpensesAddon: nonLegalEntityAddon,
      normalizationsAddon: norm,
    }
  }

  const ebitdaForYear = (year: number): number | null => {
    const row = fin[year]
    if (!row) {
      return null
    }
    return deriveFinRow(row, extrasFor(year)).ebitda
  }

  const defaultWeightFor = (year: number, isFuture: boolean): number => {
    if (isFuture && valuationSettings.forecastIncluded) {
      const offset = year - lastClosedYear
      if (offset === 1) {
        return EBITDA_YEAR_WEIGHTS_DEFAULT.forecast1
      }
      if (offset === 2) {
        return EBITDA_YEAR_WEIGHTS_DEFAULT.forecast2
      }
      if (offset === EBITDA_FORECAST_YEAR_COUNT) {
        return EBITDA_YEAR_WEIGHTS_DEFAULT.forecast3
      }
      return 1
    }
    if (
      !isFuture &&
      year === lastClosedYear &&
      valuationSettings.forecastIncluded
    ) {
      return EBITDA_YEAR_WEIGHTS_DEFAULT.lastClosed
    }
    return 1
  }

  const weightFor = (year: number, isFuture: boolean): number => {
    const stored = historyWeightOverrides[year]
    if (stored !== undefined && !isNaN(stored) && stored >= 0) {
      return stored
    }
    return defaultWeightFor(year, isFuture)
  }

  let yearsUsed: EbitdaYearPoint[] = []

  if (valuationSettings.forecastIncluded) {
    result.ebitdaSource = 'forecast'
    const yearsList = [
      { year: lastClosedYear, isFuture: false },
      { year: lastClosedYear + 1, isFuture: true },
      { year: lastClosedYear + 2, isFuture: true },
      { year: lastClosedYear + EBITDA_FORECAST_YEAR_COUNT, isFuture: true },
    ]
    yearsUsed = yearsList.map(({ year, isFuture }) => ({
      year,
      isFuture,
      ebitda: ebitdaForYear(year),
      weight: weightFor(year, isFuture),
    }))
  } else if (valuationSettings.historyIncluded) {
    result.ebitdaSource = 'weighted'
    const useCustomWeights = valuationSettings.adjustHistoryWeights
    yearsUsed = [lastClosedYear - 2, lastClosedYear - 1, lastClosedYear].map(
      year => ({
        year,
        isFuture: false,
        ebitda: ebitdaForYear(year),
        weight: useCustomWeights ? weightFor(year, false) : 1,
      }),
    )
  } else {
    result.ebitdaSource = 'lastYear'
    const ebitda = ebitdaForYear(lastClosedYear)
    result.ebitdaPerYear = [
      { year: lastClosedYear, isFuture: false, ebitda, weight: 1 },
    ]
    result.ebitdaUsed = ebitda
  }

  if (yearsUsed.length > 0) {
    result.ebitdaPerYear = yearsUsed
    let numerator = 0
    let denominator = 0
    for (const point of yearsUsed) {
      if (point.ebitda !== null) {
        numerator += point.ebitda * point.weight
        denominator += point.weight
      }
    }
    if (denominator > 0) {
      result.ebitdaUsed = numerator / denominator
    } else {
      const valid = yearsUsed
        .map(point => point.ebitda)
        .filter((ebitda): ebitda is number => ebitda !== null)
      if (valid.length > 0) {
        result.ebitdaUsed = valid.reduce((a, b) => a + b, 0) / valid.length
        result.ebitdaUsedFallback = true
      } else {
        result.ebitdaUsed = null
      }
    }
  }

  if (result.ebitdaUsed === null) {
    result.error = 'Geen EBITDA-data beschikbaar voor de berekening.'
    return result
  }

  if (
    valuationSettings.manualMultipleEnabled &&
    valuationSettings.manualMultipleValue !== null &&
    valuationSettings.manualMultipleValue > 0
  ) {
    result.manualMultipleUsed = valuationSettings.manualMultipleValue
    result.sectorMultipleAdjusted = valuationSettings.manualMultipleValue
    result.value = Math.max(
      0,
      result.ebitdaUsed * valuationSettings.manualMultipleValue,
    )
    return result
  }

  const sectorLower = sector.toLowerCase()
  let matchedMultiple =
    valuationMultiples.find(m => m.label.toLowerCase() === sectorLower) ?? null
  if (!matchedMultiple) {
    matchedMultiple =
      valuationMultiples.find(m =>
        sectorLower.includes(m.label.toLowerCase()),
      ) ?? null
  }
  if (!matchedMultiple) {
    result.error = `Geen sector-multiple gevonden voor "${sector}".`
    return result
  }
  result.sectorLabel = matchedMultiple.label
  result.sectorMultipleRaw = matchedMultiple.value

  const ebitdaMatch =
    smallEbitdaDeductions.find(range =>
      inRange(result.ebitdaUsed, range.fromEbitda, range.toEbitda),
    ) ?? null
  if (ebitdaMatch) {
    result.smallEbitdaApplied = ebitdaMatch
  }

  const orgMatch =
    employees !== null
      ? (smallOrgDeductions.find(range =>
          inRange(employees, range.fromFte, range.toFte),
        ) ?? null)
      : null
  if (orgMatch) {
    result.smallOrgApplied = orgMatch
  }

  let adjustedMultiple = result.sectorMultipleRaw
  if (ebitdaMatch) {
    adjustedMultiple -= ebitdaMatch.deduction
  }
  if (orgMatch) {
    adjustedMultiple -= orgMatch.deduction
  }
  adjustedMultiple = Math.max(0, adjustedMultiple)
  result.sectorMultipleAdjusted = adjustedMultiple

  result.value = Math.round(Math.max(0, result.ebitdaUsed * adjustedMultiple))

  return result
}
