import {
  HEURISTIC_BASE_YEAR_LOOKBACK_MAX,
  HEURISTIC_DCF_PARAMS_DEFAULT,
  HEURISTIC_DISCOUNT_TERMINAL_GROWTH_SAFETY_MARGIN,
  HEURISTIC_EBITDA_MARGIN_STRONG_MULTIPLE_ADD,
  HEURISTIC_EBITDA_MARGIN_STRONG_THRESHOLD_PCT,
  HEURISTIC_EBITDA_MARGIN_WEAK_MULTIPLE_ADD,
  HEURISTIC_EBITDA_MARGIN_WEAK_THRESHOLD_PCT,
  HEURISTIC_EBITDA_MULTIPLE_FLOOR,
  HEURISTIC_GROWTH_DECLINE_EBITDA_MULTIPLE_ADD,
  HEURISTIC_GROWTH_DECLINE_REVENUE_MULTIPLE_ADD,
  HEURISTIC_GROWTH_DECLINE_THRESHOLD_PCT,
  HEURISTIC_GROWTH_HEALTHY_EBITDA_MULTIPLE_ADD,
  HEURISTIC_GROWTH_HEALTHY_REVENUE_MULTIPLE_ADD,
  HEURISTIC_GROWTH_HEALTHY_THRESHOLD_PCT,
  HEURISTIC_GROWTH_STRONG_EBITDA_MULTIPLE_ADD,
  HEURISTIC_GROWTH_STRONG_REVENUE_MULTIPLE_ADD,
  HEURISTIC_GROWTH_STRONG_THRESHOLD_PCT,
  HEURISTIC_HIGH_BAND_RATIO,
  HEURISTIC_INITIAL_GROWTH_DEFAULT,
  HEURISTIC_LOW_BAND_RATIO,
  HEURISTIC_MIDPOINT_DCF_WEIGHT,
  HEURISTIC_MIDPOINT_EBITDA_WEIGHT,
  HEURISTIC_MIDPOINT_REVENUE_WEIGHT,
  HEURISTIC_PERCENT_MULTIPLIER,
  HEURISTIC_PROJECTION_YEARS_MAX,
  HEURISTIC_PROJECTION_YEARS_MIN,
  HEURISTIC_RECURRING_HIGH_EBITDA_MULTIPLE_ADD,
  HEURISTIC_RECURRING_HIGH_REVENUE_MULTIPLE_ADD,
  HEURISTIC_RECURRING_HIGH_THRESHOLD_PCT,
  HEURISTIC_RECURRING_MEDIUM_EBITDA_MULTIPLE_ADD,
  HEURISTIC_RECURRING_MEDIUM_REVENUE_MULTIPLE_ADD,
  HEURISTIC_RECURRING_MEDIUM_THRESHOLD_PCT,
  HEURISTIC_REVENUE_GROWTH_PERCENT_SCALE,
  HEURISTIC_REVENUE_GROWTH_ROUNDING_DIVISOR,
  HEURISTIC_REVENUE_MULTIPLE_FLOOR,
  HEURISTIC_SECTOR_MULTIPLES,
  HEURISTIC_SECTOR_MULTIPLES_FALLBACK_KEY,
  HEURISTIC_SIZE_LARGE_MULTIPLE_ADD,
  HEURISTIC_SIZE_LARGE_THRESHOLD,
  HEURISTIC_SIZE_SMALL_MULTIPLE_ADD,
  HEURISTIC_SIZE_SMALL_THRESHOLD,
} from '../constants/heuristicValuation'
import {
  type FinancialYearInput,
  type HeuristicValuationCompanyInputs,
  type NonLegalEntityValuation,
  type Normalization,
  type ValuationDcfParams,
  type ValuationDcfRow,
  type ValuationDriver,
  type ValuationResultRecord,
} from '../types'
import { computeNonLegalEntityAddon } from './computeNonLegalEntityAddon'
import { computeNormalizationsForYear } from './computeNormalizationsForYear'
import { deriveFinRow } from './deriveFinRow'

export const defaultHeuristicDcfParams = (
  revenueGrowth: number | null,
): ValuationDcfParams => ({
  ...HEURISTIC_DCF_PARAMS_DEFAULT,
  initialGrowth: revenueGrowth ?? HEURISTIC_INITIAL_GROWTH_DEFAULT,
})

export const resolveHeuristicDcfParams = (
  revenueGrowth: number | null,
  stored: ValuationDcfParams | null,
): ValuationDcfParams => ({
  ...defaultHeuristicDcfParams(revenueGrowth),
  ...stored,
})

export const deriveHeuristicValuationCompanyInputs = (
  fin: Record<number, FinancialYearInput>,
  lastClosedYear: number,
  sector: string,
  recurringRevenue: number | null,
  nonLegalEntityConfig: NonLegalEntityValuation | null,
  normalizations: Normalization[],
): HeuristicValuationCompanyInputs => {
  let baseYear: number | null = null
  if (fin[lastClosedYear]?.revenue != null) {
    baseYear = lastClosedYear
  } else {
    for (
      let year = lastClosedYear - 1;
      year >= lastClosedYear - HEURISTIC_BASE_YEAR_LOOKBACK_MAX;
      year--
    ) {
      if (fin[year]?.revenue != null) {
        baseYear = year
        break
      }
    }
  }

  if (baseYear === null) {
    return {
      sector,
      revenue: null,
      ebitda: null,
      revenueGrowth: null,
      recurringRevenue,
    }
  }

  const addon = computeNonLegalEntityAddon(nonLegalEntityConfig)
  const norm = computeNormalizationsForYear(normalizations, baseYear)
  const derived = deriveFinRow(fin[baseYear], {
    operatingExpensesAddon: addon,
    normalizationsAddon: norm,
  })

  const previousRevenue = fin[baseYear - 1]?.revenue ?? null
  const revenueGrowth =
    previousRevenue && derived.revenue
      ? Math.round(
          ((derived.revenue - previousRevenue) / previousRevenue) *
            HEURISTIC_REVENUE_GROWTH_PERCENT_SCALE,
        ) / HEURISTIC_REVENUE_GROWTH_ROUNDING_DIVISOR
      : null

  return {
    sector,
    revenue: derived.revenue,
    ebitda: derived.ebitda,
    revenueGrowth,
    recurringRevenue,
  }
}

export const computeHeuristicValuation = (
  inputs: HeuristicValuationCompanyInputs,
  params: ValuationDcfParams,
): Omit<ValuationResultRecord, 'madeAt' | 'snapshotCompany'> => {
  const revenue = inputs.revenue ?? 0
  const ebitda = inputs.ebitda ?? 0

  const base =
    HEURISTIC_SECTOR_MULTIPLES[
      inputs.sector as keyof typeof HEURISTIC_SECTOR_MULTIPLES
    ] ?? HEURISTIC_SECTOR_MULTIPLES[HEURISTIC_SECTOR_MULTIPLES_FALLBACK_KEY]

  let ebitdaMultiple: number = base.ebitda
  let revenueMultiple: number = base.revenue
  const drivers: ValuationDriver[] = []

  const growth = inputs.revenueGrowth ?? 0
  if (growth >= HEURISTIC_GROWTH_STRONG_THRESHOLD_PCT) {
    ebitdaMultiple += HEURISTIC_GROWTH_STRONG_EBITDA_MULTIPLE_ADD
    revenueMultiple += HEURISTIC_GROWTH_STRONG_REVENUE_MULTIPLE_ADD
    drivers.push({
      label: 'Sterke omzetgroei',
      note: `${growth}% groei verhoogt de waarde`,
      impact: 1,
      impactLabel: 'sterk positief',
    })
  } else if (growth >= HEURISTIC_GROWTH_HEALTHY_THRESHOLD_PCT) {
    ebitdaMultiple += HEURISTIC_GROWTH_HEALTHY_EBITDA_MULTIPLE_ADD
    revenueMultiple += HEURISTIC_GROWTH_HEALTHY_REVENUE_MULTIPLE_ADD
    drivers.push({
      label: 'Gezonde omzetgroei',
      note: `${growth}% groei`,
      impact: 1,
      impactLabel: 'positief',
    })
  } else if (growth < HEURISTIC_GROWTH_DECLINE_THRESHOLD_PCT) {
    ebitdaMultiple += HEURISTIC_GROWTH_DECLINE_EBITDA_MULTIPLE_ADD
    revenueMultiple += HEURISTIC_GROWTH_DECLINE_REVENUE_MULTIPLE_ADD
    drivers.push({
      label: 'Krimpende omzet',
      note: `${growth}% groei vermindert waarde`,
      impact: -1,
      impactLabel: 'negatief',
    })
  } else {
    drivers.push({
      label: 'Stabiele omzet',
      note: `${growth}% groei is neutraal`,
      impact: 0,
      impactLabel: 'neutraal',
    })
  }

  const recurring = inputs.recurringRevenue ?? 0
  if (recurring >= HEURISTIC_RECURRING_HIGH_THRESHOLD_PCT) {
    ebitdaMultiple += HEURISTIC_RECURRING_HIGH_EBITDA_MULTIPLE_ADD
    revenueMultiple += HEURISTIC_RECURRING_HIGH_REVENUE_MULTIPLE_ADD
    drivers.push({
      label: 'Hoge recurring revenue',
      note: `${recurring}% terugkerende omzet`,
      impact: 1,
      impactLabel: 'sterk positief',
    })
  } else if (recurring >= HEURISTIC_RECURRING_MEDIUM_THRESHOLD_PCT) {
    ebitdaMultiple += HEURISTIC_RECURRING_MEDIUM_EBITDA_MULTIPLE_ADD
    revenueMultiple += HEURISTIC_RECURRING_MEDIUM_REVENUE_MULTIPLE_ADD
    drivers.push({
      label: 'Recurring revenue',
      note: `${recurring}% terugkerend`,
      impact: 1,
      impactLabel: 'positief',
    })
  } else if (recurring > 0) {
    drivers.push({
      label: 'Beperkte recurring revenue',
      note: `${recurring}% terugkerend`,
      impact: 0,
      impactLabel: 'neutraal',
    })
  }

  const margin = (ebitda / revenue) * HEURISTIC_PERCENT_MULTIPLIER
  if (margin >= HEURISTIC_EBITDA_MARGIN_STRONG_THRESHOLD_PCT) {
    ebitdaMultiple += HEURISTIC_EBITDA_MARGIN_STRONG_MULTIPLE_ADD
    drivers.push({
      label: 'Sterke EBITDA-marge',
      note: `${margin.toFixed(1)}% EBITDA-marge`,
      impact: 1,
      impactLabel: 'positief',
    })
  } else if (margin < HEURISTIC_EBITDA_MARGIN_WEAK_THRESHOLD_PCT) {
    ebitdaMultiple += HEURISTIC_EBITDA_MARGIN_WEAK_MULTIPLE_ADD
    drivers.push({
      label: 'Lage EBITDA-marge',
      note: `${margin.toFixed(1)}% EBITDA-marge`,
      impact: -1,
      impactLabel: 'negatief',
    })
  } else {
    drivers.push({
      label: 'Gezonde EBITDA-marge',
      note: `${margin.toFixed(1)}% EBITDA-marge`,
      impact: 0,
      impactLabel: 'neutraal',
    })
  }

  if (revenue >= HEURISTIC_SIZE_LARGE_THRESHOLD) {
    ebitdaMultiple += HEURISTIC_SIZE_LARGE_MULTIPLE_ADD
    drivers.push({
      label: 'Schaalvoordelen',
      note: 'Omzet >€10mln verhoogt aantrekkelijkheid',
      impact: 1,
      impactLabel: 'positief',
    })
  } else if (revenue < HEURISTIC_SIZE_SMALL_THRESHOLD) {
    ebitdaMultiple += HEURISTIC_SIZE_SMALL_MULTIPLE_ADD
    drivers.push({
      label: 'Beperkte schaal',
      note: 'Kleinere omzet beperkt kopersgroep',
      impact: -1,
      impactLabel: 'negatief',
    })
  }

  ebitdaMultiple = Math.max(HEURISTIC_EBITDA_MULTIPLE_FLOOR, ebitdaMultiple)
  revenueMultiple = Math.max(HEURISTIC_REVENUE_MULTIPLE_FLOOR, revenueMultiple)

  const ebitdaValue = ebitda * ebitdaMultiple
  const revenueValue = revenue * revenueMultiple

  const discount = params.discountRate / HEURISTIC_PERCENT_MULTIPLIER
  const termGrowth = Math.min(
    params.terminalGrowth / HEURISTIC_PERCENT_MULTIPLIER,
    discount - HEURISTIC_DISCOUNT_TERMINAL_GROWTH_SAFETY_MARGIN,
  )
  const fade = params.growthFade / HEURISTIC_PERCENT_MULTIPLIER
  const years = Math.max(
    HEURISTIC_PROJECTION_YEARS_MIN,
    Math.min(
      HEURISTIC_PROJECTION_YEARS_MAX,
      Math.round(params.projectionYears),
    ),
  )

  let cashflow = ebitda
  let growthRate = params.initialGrowth / HEURISTIC_PERCENT_MULTIPLIER
  let dcfValue = 0
  const dcfRows: ValuationDcfRow[] = []
  for (let year = 1; year <= years; year++) {
    cashflow = cashflow * (1 + growthRate)
    const discountFactor = 1 / Math.pow(1 + discount, year)
    const pv = cashflow * discountFactor
    dcfValue += pv
    dcfRows.push({
      year,
      growth: growthRate * HEURISTIC_PERCENT_MULTIPLIER,
      cashflow: Math.round(cashflow),
      discountFactor,
      pv: Math.round(pv),
    })
    growthRate = termGrowth + (growthRate - termGrowth) * (1 - fade)
  }

  const terminalCashflow = cashflow * (1 + termGrowth)
  const terminalValueAtHorizon =
    discount > termGrowth ? terminalCashflow / (discount - termGrowth) : 0
  const terminalPv = terminalValueAtHorizon / Math.pow(1 + discount, years)
  dcfValue += terminalPv

  const midpoint = Math.round(
    ebitdaValue * HEURISTIC_MIDPOINT_EBITDA_WEIGHT +
      revenueValue * HEURISTIC_MIDPOINT_REVENUE_WEIGHT +
      dcfValue * HEURISTIC_MIDPOINT_DCF_WEIGHT,
  )
  const low = Math.round(midpoint * HEURISTIC_LOW_BAND_RATIO)
  const high = Math.round(midpoint * HEURISTIC_HIGH_BAND_RATIO)

  return {
    midpoint,
    low,
    high,
    ebitdaValue: Math.round(ebitdaValue),
    revenueValue: Math.round(revenueValue),
    dcfValue: Math.round(dcfValue),
    ebitdaMultiple,
    revenueMultiple,
    baseEbitdaMultiple: base.ebitda,
    drivers,
    dcfRows,
    terminalCashflow: Math.round(terminalCashflow),
    terminalPv: Math.round(terminalPv),
    terminalGrowthUsed: termGrowth * HEURISTIC_PERCENT_MULTIPLIER,
    calculatedAt: Date.now(),
  }
}
