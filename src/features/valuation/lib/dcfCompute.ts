import {
  DCF_HISTORICAL_YEARS_DISPLAYED,
  DCF_RESTWAARDE_CAP_RATIO,
  DCF_SECTORCORRECTIE_BASE_MULTIPLE,
  DCF_SECTORCORRECTIE_STEP,
  DCF_YEAR_COUNT_FALLBACK,
  DCF_YEAR_COUNT_MAX,
  DCF_YEAR_COUNT_MIN,
} from '../constants/dcf'
import {
  type DcfNewBerekeningResult,
  type DcfNewBerekeningRow,
  type DcfNewComputeResult,
  type DcfNewResolvedInputs,
  type FinancialYearInput,
  type Normalization,
} from '../types'
import { computeNormalizationsForYear } from './computeNormalizationsForYear'

export const computeSectorcorrectieFromMultiple = (
  sectorMultiple: number,
): number =>
  (DCF_SECTORCORRECTIE_BASE_MULTIPLE - sectorMultiple) *
  DCF_SECTORCORRECTIE_STEP

const dcfNewComputeBerekening = (
  inputs: DcfNewResolvedInputs,
  kostenvoet: number,
  startYear: number,
  yearCount: number,
  fin: Record<number, FinancialYearInput>,
  normalizations: Normalization[],
): DcfNewBerekeningResult => {
  const allYears = Object.keys(fin)
    .map(y => parseInt(y, 10))
    .filter(y => !isNaN(y))
    .sort((a, b) => a - b)

  const historicalYears = allYears
    .filter(y => y < startYear)
    .slice(-DCF_HISTORICAL_YEARS_DISPLAYED)
  const scenarioYears = Array.from(
    { length: yearCount },
    (_, index) => startYear + index,
  )
  const restYear = startYear + yearCount

  const rowFor = (
    year: number,
    dfPower: number | 'rest' | null,
  ): DcfNewBerekeningRow | null => {
    const row = fin[year]
    if (!row) {
      return null
    }
    const revenue = row.revenue ?? 0
    const cogs = row.cogs ?? 0
    const opex = row.operatingExpenses ?? 0
    const depreciation = row.depreciation ?? 0
    const interest = row.interest ?? 0
    const taxes = row.taxesPaid ?? 0

    const ebitda = revenue - cogs - opex
    const ebit = ebitda - depreciation
    const nettoResultaat = ebit - interest - taxes
    const norm = computeNormalizationsForYear(normalizations, year)
    const nettoResultaatGenorm = nettoResultaat + norm
    const noplat = ebit - taxes

    const investeringen = inputs.investeringen[year] ?? 0
    const aflossingen = inputs.aflossingen[year] ?? 0
    const fcf = noplat + depreciation - investeringen - aflossingen

    let df: number | null = null
    let cw: number | null = null
    if (dfPower === 'rest') {
      const groeiRest = inputs.uitgangspunten.groeiRest
      df = 1 - groeiRest
      cw = fcf * df
    } else if (typeof dfPower === 'number') {
      const base = 1 - kostenvoet
      df = base > 0 ? Math.pow(base, dfPower) : 0
      cw = fcf * (1 - df)
    }

    return {
      revenue,
      ebitda,
      ebit,
      vpb: taxes,
      intrest: interest,
      nettoResultaat,
      normalisering: norm,
      nettoResultaatGenorm,
      noplat,
      afschrijvingen: depreciation,
      investeringen,
      aflossingen,
      fcf,
      df,
      cw,
      type:
        dfPower === 'rest'
          ? 'rest'
          : typeof dfPower === 'number'
            ? 'scen'
            : 'hist',
    }
  }

  const data: Record<number, DcfNewBerekeningRow> = {}
  historicalYears.forEach(year => {
    const row = rowFor(year, null)
    if (row) {
      data[year] = row
    }
  })
  scenarioYears.forEach((year, index) => {
    const row = rowFor(year, index + 1)
    if (row) {
      data[year] = row
    }
  })
  const restRow = rowFor(restYear, 'rest')
  if (restRow) {
    data[restYear] = restRow
  }

  let waardeScenario = 0
  scenarioYears.forEach(year => {
    const row = data[year]
    if (row && typeof row.cw === 'number' && isFinite(row.cw)) {
      waardeScenario += row.cw
    }
  })

  const lastScenarioYear =
    scenarioYears.length > 0 ? scenarioYears[scenarioYears.length - 1] : null
  const lastScenarioDf =
    lastScenarioYear !== null &&
    data[lastScenarioYear] &&
    isFinite(data[lastScenarioYear].df ?? NaN)
      ? (data[lastScenarioYear].df as number)
      : 0
  const restCw =
    data[restYear] && isFinite(data[restYear].cw ?? NaN)
      ? (data[restYear].cw as number)
      : 0
  let waardeRest = restCw * lastScenarioDf

  const restCapEnabled = inputs.uitgangspunten.restwaardeCap !== false
  if (restCapEnabled) {
    const maxRest = waardeScenario * DCF_RESTWAARDE_CAP_RATIO
    if (waardeRest > maxRest) {
      waardeRest = maxRest
    }
  }

  const totaal = waardeScenario + waardeRest

  return {
    historicalYears,
    scenarioYears,
    restYear,
    data,
    totalen: { waardeScenario, waardeRest, totaal },
  }
}

export const dcfNewCompute = (
  inputs: DcfNewResolvedInputs,
  fin: Record<number, FinancialYearInput>,
  normalizations: Normalization[],
): DcfNewComputeResult => {
  const subtotaal1 = inputs.rfr + inputs.mrp + inputs.sectoropslag + inputs.ip

  const klein = {
    adh: inputs.klein.adh.waarde * inputs.klein.adh.midPct,
    afn: inputs.klein.afn.waarde * inputs.klein.afn.midPct,
    alr: inputs.klein.alr.waarde * inputs.klein.alr.midPct,
  }
  const kleinPremie = klein.adh + klein.afn + klein.alr

  const asset = {
    rep: inputs.asset.rep.waarde * inputs.asset.rep.midPct,
    act: inputs.asset.act.waarde * inputs.asset.act.midPct,
    toetr: inputs.asset.toetr.waarde * inputs.asset.toetr.midPct,
    trackR: inputs.asset.trackR.waarde * inputs.asset.trackR.midPct,
  }
  const alfa = asset.rep + asset.act + asset.toetr + asset.trackR

  const kostenvoet = subtotaal1 + kleinPremie + alfa

  const startYear = inputs.scenarioStartYear
  const yearCount = Math.max(
    DCF_YEAR_COUNT_MIN,
    Math.min(
      DCF_YEAR_COUNT_MAX,
      inputs.scenarioYearCount || DCF_YEAR_COUNT_FALLBACK,
    ),
  )

  const discRows: Array<{ year: number; n: number; df: number }> = []
  for (let n = 1; n <= yearCount; n++) {
    const base = 1 - kostenvoet
    const df = base > 0 ? Math.pow(base, n) : 0
    discRows.push({ year: startYear + (n - 1), n, df })
  }
  const restDf = discRows.length > 0 ? discRows[discRows.length - 1].df : 0

  const berekening = dcfNewComputeBerekening(
    inputs,
    kostenvoet,
    startYear,
    yearCount,
    fin,
    normalizations,
  )

  return {
    subtotaal1,
    klein,
    kleinPremie,
    asset,
    alfa,
    kostenvoet,
    discRows,
    restDf,
    berekening,
  }
}
