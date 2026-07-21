import { getCompany, getSectorOptions } from '@features/company/queries'
import { getServerClient } from '@shared/supabase/server'

import {
  APP_CONFIG_DCF_ADMIN_DEFAULTS_KEY,
  DCF_ILLIQUIDITY_PREMIUM_DEFAULT,
  DCF_KLEIN_PREMIE_FACTORS,
  DCF_MARKET_RISK_PREMIUM_DEFAULT,
  DCF_RISK_FREE_RATE_DEFAULT,
  DCF_SCENARIO_YEAR_COUNT_DEFAULT,
  DCF_SECTORCORRECTIE_BASE_MULTIPLE,
  DCF_ASSET_RISK_FACTORS,
  DCF_UITGANGSPUNTEN_DEFAULT,
} from './constants/dcf'
import {
  APP_CONFIG_SMALL_EBITDA_DEDUCTIONS_KEY,
  APP_CONFIG_SMALL_ORG_DEDUCTIONS_KEY,
  VALUATION_BAND_DEFAULT_PCT,
} from './constants/sectorMultiples'
import { type ValuationReportGammaData } from './lib/buildValuationGammaPrompt'
import { computeAandeelhouderswaardeVerrekening } from './lib/computeAandeelhouderswaardeVerrekening'
import { computeIndicatieveOndernemingswaarde } from './lib/computeIndicatieveOndernemingswaarde'
import {
  computeSectorcorrectieFromMultiple,
  dcfNewCompute,
} from './lib/dcfCompute'
import {
  AppConfigDcfAdminDefaultsSchema,
  AppConfigSmallEbitdaDeductionsSchema,
  AppConfigSmallOrgDeductionsSchema,
  CompanyValuationRowSchema,
  FinancialsRowSchema,
  ValuationDcfParamsSchema,
  ValuationResultRecordSchema,
  type CompanyValuationRow,
} from './schema'
import {
  type DcfAdminDefaults,
  type DcfNewInputs,
  type DcfNewResolvedInputs,
  type EbitdaDeductionRange,
  type FinancialYearInput,
  type NonLegalEntityValuation,
  type Normalization,
  type OrgDeductionRange,
  type ValuationDcfParams,
  type ValuationMultiple,
  type ValuationResultRecord,
  type ValuationReportContent,
  type ValuationReview,
  type ValuationSettings,
  type ValueDriverAnswers,
  type ShareholderValueInputs,
} from './types'

export const getFinancials = async (
  userId: string,
): Promise<FinancialYearInput[]> => {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('financials')
    .select(
      'year, revenue, cogs, operating_expenses, depreciation, interest, taxes_paid',
    )
    .eq('user_id', userId)

  if (error || !data) {
    return []
  }

  return data
    .map(row => FinancialsRowSchema.safeParse(row))
    .filter(result => result.success)
    .map(result => ({
      year: result.data.year,
      revenue: result.data.revenue,
      cogs: result.data.cogs,
      operatingExpenses: result.data.operating_expenses,
      depreciation: result.data.depreciation,
      interest: result.data.interest,
      taxesPaid: result.data.taxes_paid,
    }))
}

export const DEFAULT_DCF_NEW_INPUTS: DcfNewInputs = {
  ip: DCF_ILLIQUIDITY_PREMIUM_DEFAULT,
  klein: DCF_KLEIN_PREMIE_FACTORS,
  asset: DCF_ASSET_RISK_FACTORS,
  scenarioStartYear: new Date().getFullYear(),
  scenarioYearCount: DCF_SCENARIO_YEAR_COUNT_DEFAULT,
  investeringen: {},
  aflossingen: {},
  uitgangspunten: DCF_UITGANGSPUNTEN_DEFAULT,
}

export interface CompanyValuationFields {
  autoForecast: boolean
  dcfApplyEnabled: boolean
  dcfNewInputs: DcfNewInputs
  lastClosedYear: number | null
  nonLegalEntityConfig: NonLegalEntityValuation | null
  normalizations: Normalization[]
  shareholderValue: ShareholderValueInputs
  valuationBand: number | null
  valuationReport: ValuationReportContent
  valuationReview: ValuationReview | null
  valuationSettings: ValuationSettings
  valueDriverAnswers: ValueDriverAnswers
}

const rowToCompanyValuationFields = (
  row: CompanyValuationRow,
): CompanyValuationFields => ({
  autoForecast: row.auto_forecast,
  dcfApplyEnabled: row.dcf_apply_enabled ?? false,
  dcfNewInputs: row.dcf_new_inputs ?? DEFAULT_DCF_NEW_INPUTS,
  lastClosedYear: row.last_closed_year,
  valuationBand: row.valuation_band,
  normalizations: (row.extra.normalizations ?? []).map(normalization => ({
    ...normalization,
    years: normalization.years ?? null,
  })),
  valueDriverAnswers: row.extra.valueDrivers ?? {},
  valuationSettings: {
    historyIncluded: row.extra.valuationSettings?.historyIncluded ?? false,
    adjustHistoryWeights:
      row.extra.valuationSettings?.adjustHistoryWeights ?? false,
    forecastIncluded: row.extra.valuationSettings?.forecastIncluded ?? false,
    dcfApplyEnabled: row.dcf_apply_enabled ?? false,
    manualMultipleEnabled: row.extra.manualMultipleEnabled ?? false,
    manualMultipleValue: row.extra.manualMultipleValue ?? null,
  },
  nonLegalEntityConfig: row.extra.nonLegalEntityValuation ?? null,
  valuationReport: {
    foreword: row.extra.valuationReport?.foreword ?? '',
    financialsNote: row.extra.valuationReport?.financialsNote ?? '',
    valueDriversNote: row.extra.valuationReport?.valueDriversNote ?? '',
    closing: row.extra.valuationReport?.closing ?? '',
  },
  valuationReview: row.extra.valuationReview ?? null,
  shareholderValue: {
    kostprijsOmzetV2: row.extra.kostprijsOmzetV2 ?? null,
    lastClosedBalanceYear: row.extra.lastClosedBalanceYear ?? null,
    bedrijfskostenV2: row.extra.bedrijfskostenV2 ?? null,
    totaleKostenMaandenV2: row.extra.totaleKostenMaandenV2 ?? null,
    debiteurenV2: row.extra.debiteurenV2 ?? null,
    crediteurenV2: row.extra.crediteurenV2 ?? null,
    werkkapitaalExtrasV2: row.extra.werkkapitaalExtrasV2 ?? [],
    liquideMiddelenV2: row.extra.liquideMiddelenV2 ?? null,
    vakantiegeldV2: row.extra.vakantiegeldV2 ?? null,
    kortlopendeSchuldenV2: row.extra.kortlopendeSchuldenV2 ?? null,
    dcfreeExtrasV2: row.extra.dcfreeExtrasV2 ?? [],
  },
})

export const getCompanyValuationFields = async (
  userId: string,
): Promise<CompanyValuationFields | null> => {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('companies')
    .select(
      'auto_forecast, dcf_apply_enabled, dcf_new_inputs, extra, last_closed_year, valuation_band',
    )
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  const result = CompanyValuationRowSchema.safeParse(data)

  return result.success ? rowToCompanyValuationFields(result.data) : null
}

export const getValuationMultiples = async (): Promise<ValuationMultiple[]> =>
  getSectorOptions()

export const getDcfAdminDefaults = async (): Promise<DcfAdminDefaults> => {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', APP_CONFIG_DCF_ADMIN_DEFAULTS_KEY)
    .maybeSingle()

  const fallback: DcfAdminDefaults = {
    rfr: DCF_RISK_FREE_RATE_DEFAULT,
    mrp: DCF_MARKET_RISK_PREMIUM_DEFAULT,
    liquiditeitspremie: DCF_ILLIQUIDITY_PREMIUM_DEFAULT,
  }

  if (error || !data) {
    return fallback
  }

  const result = AppConfigDcfAdminDefaultsSchema.safeParse(data.value)

  return result.success ? result.data : fallback
}

export const getSmallEbitdaDeductions = async (): Promise<
  EbitdaDeductionRange[]
> => {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', APP_CONFIG_SMALL_EBITDA_DEDUCTIONS_KEY)
    .maybeSingle()

  if (error || !data) {
    return []
  }

  const result = AppConfigSmallEbitdaDeductionsSchema.safeParse(data.value)

  return result.success ? result.data : []
}

export const getSmallOrgDeductions = async (): Promise<OrgDeductionRange[]> => {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', APP_CONFIG_SMALL_ORG_DEDUCTIONS_KEY)
    .maybeSingle()

  if (error || !data) {
    return []
  }

  const result = AppConfigSmallOrgDeductionsSchema.safeParse(data.value)

  return result.success ? result.data : []
}

export const resolveDcfNewInputs = (
  dcfNewInputs: DcfNewInputs,
  adminDefaults: DcfAdminDefaults,
  sectorMultiple: number,
): DcfNewResolvedInputs => ({
  ...dcfNewInputs,
  ip: adminDefaults.liquiditeitspremie,
  rfr: adminDefaults.rfr,
  mrp: adminDefaults.mrp,
  sectoropslag: computeSectorcorrectieFromMultiple(sectorMultiple),
})

export const getValuationRecord = async (
  userId: string,
): Promise<{
  result: ValuationResultRecord | null
  dcfParams: ValuationDcfParams | null
}> => {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('valuations')
    .select('result, dcf_params')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) {
    return { result: null, dcfParams: null }
  }

  const resultParsed = ValuationResultRecordSchema.safeParse(data.result)
  const dcfParamsParsed = ValuationDcfParamsSchema.safeParse(data.dcf_params)

  return {
    result: resultParsed.success
      ? {
          madeAt: resultParsed.data.madeAt ?? null,
          snapshotCompany:
            (resultParsed.data
              .snapshotCompany as ValuationResultRecord['snapshotCompany']) ??
            null,
          low: resultParsed.data.low,
          high: resultParsed.data.high,
          midpoint: resultParsed.data.midpoint,
          dcfValue: resultParsed.data.dcfValue,
          ebitdaValue: resultParsed.data.ebitdaValue,
          revenueValue: resultParsed.data.revenueValue,
          ebitdaMultiple: resultParsed.data.ebitdaMultiple,
          revenueMultiple: resultParsed.data.revenueMultiple,
          baseEbitdaMultiple: resultParsed.data.baseEbitdaMultiple,
          terminalCashflow: resultParsed.data.terminalCashflow,
          terminalPv: resultParsed.data.terminalPv,
          terminalGrowthUsed: resultParsed.data.terminalGrowthUsed,
          calculatedAt: resultParsed.data.calculatedAt,
          dcfRows: resultParsed.data.dcfRows,
          drivers: resultParsed.data.drivers,
        }
      : null,
    dcfParams: dcfParamsParsed.success ? dcfParamsParsed.data : null,
  }
}

export const isValuationMade = (
  record: ValuationResultRecord | null,
): boolean => record?.madeAt != null

export interface ResolvedCompanyData {
  dcfApplyEnabled: boolean
  dcfNewInputs: DcfNewInputs
  employees: number | null
  financials: Record<number, FinancialYearInput>
  financialsList: FinancialYearInput[]
  lastClosedYear: number
  legalForm: string
  made: boolean
  nonLegalEntityConfig: NonLegalEntityValuation | null
  normalizations: Normalization[]
  recurringRevenue: number | null
  sector: string
  valuationBand: number | null
  valuationSettings: ValuationSettings
  valueDriverAnswers: ValueDriverAnswers
}

const FALLBACK_LAST_CLOSED_YEAR = new Date().getFullYear() - 1

export const resolveDisplayCompanyData = async (
  userId: string,
): Promise<ResolvedCompanyData | null> => {
  const [{ result: existingResult }, fields, liveCompany, liveFinancialsList] =
    await Promise.all([
      getValuationRecord(userId),
      getCompanyValuationFields(userId),
      getCompany(userId),
      getFinancials(userId),
    ])

  const made = isValuationMade(existingResult)
  const snapshot = made ? (existingResult?.snapshotCompany ?? null) : null

  if (made) {
    if (!snapshot) {
      return null
    }

    return {
      made,
      sector: snapshot.sector,
      employees: snapshot.employees,
      legalForm: snapshot.legalForm,
      recurringRevenue: snapshot.recurringRevenue,
      financials: snapshot.financials,
      financialsList: Object.values(snapshot.financials),
      lastClosedYear: snapshot.lastClosedYear ?? FALLBACK_LAST_CLOSED_YEAR,
      normalizations: snapshot.normalizations,
      nonLegalEntityConfig: snapshot.nonLegalEntityValuation,
      valuationSettings: snapshot.valuationSettings,
      dcfApplyEnabled: snapshot.dcfApplyEnabled,
      dcfNewInputs: snapshot.dcfParams,
      valuationBand: snapshot.valuationBand,
      valueDriverAnswers: snapshot.valueDrivers,
    }
  }

  if (!liveCompany || !fields) {
    return null
  }

  return {
    made,
    sector: liveCompany.sector,
    employees: liveCompany.employees,
    legalForm: liveCompany.legalForm,
    recurringRevenue: liveCompany.recurringRevenue,
    financials: Object.fromEntries(
      liveFinancialsList.map(row => [row.year, row]),
    ),
    financialsList: liveFinancialsList,
    lastClosedYear: fields.lastClosedYear ?? FALLBACK_LAST_CLOSED_YEAR,
    normalizations: fields.normalizations,
    nonLegalEntityConfig: fields.nonLegalEntityConfig,
    valuationSettings: fields.valuationSettings,
    dcfApplyEnabled: fields.dcfApplyEnabled,
    dcfNewInputs: fields.dcfNewInputs,
    valuationBand: fields.valuationBand,
    valueDriverAnswers: fields.valueDriverAnswers,
  }
}

export const getEstimatedValue = async (
  userId: string,
): Promise<number | null> => {
  const [
    company,
    fields,
    financialsList,
    valuationMultiples,
    smallEbitdaDeductions,
    smallOrgDeductions,
  ] = await Promise.all([
    getCompany(userId),
    getCompanyValuationFields(userId),
    getFinancials(userId),
    getValuationMultiples(),
    getSmallEbitdaDeductions(),
    getSmallOrgDeductions(),
  ])

  if (!company || !fields) {
    return null
  }

  const fin: Record<number, FinancialYearInput> = Object.fromEntries(
    financialsList.map(row => [row.year, row]),
  )
  const lastClosedYear = fields.lastClosedYear ?? new Date().getFullYear() - 1

  const indicative = computeIndicatieveOndernemingswaarde({
    employees: company.employees,
    fin,
    historyWeightOverrides: {},
    lastClosedYear,
    nonLegalEntityConfig: fields.nonLegalEntityConfig,
    normalizations: fields.normalizations,
    sector: company.sector,
    smallEbitdaDeductions,
    smallOrgDeductions,
    valuationMultiples,
    valuationSettings: fields.valuationSettings,
  })

  if (!fields.dcfApplyEnabled) {
    return indicative.value
  }

  const adminDefaults = await getDcfAdminDefaults()
  const sectorMultiple =
    indicative.sectorMultipleRaw ?? DCF_SECTORCORRECTIE_BASE_MULTIPLE
  const resolved = resolveDcfNewInputs(
    fields.dcfNewInputs,
    adminDefaults,
    sectorMultiple,
  )
  const dcfResult = dcfNewCompute(resolved, fin, fields.normalizations)

  return Math.round(dcfResult.berekening.totalen.totaal)
}

// Gathers the valuation-report Gamma prompt input the same way /waardebepaling
// derives its displayed figures (enterprise/shareholder/band), plus the report
// text + financials table (spec §3.9). Returns null when a valuation record or
// company profile is missing.
export const getValuationReportGammaInput = async (
  userId: string,
): Promise<ValuationReportGammaData | null> => {
  const [
    resolved,
    company,
    fields,
    valuationMultiples,
    smallEbitdaDeductions,
    smallOrgDeductions,
  ] = await Promise.all([
    resolveDisplayCompanyData(userId),
    getCompany(userId),
    getCompanyValuationFields(userId),
    getValuationMultiples(),
    getSmallEbitdaDeductions(),
    getSmallOrgDeductions(),
  ])

  if (!resolved || !company || !fields) {
    return null
  }

  const indicative = computeIndicatieveOndernemingswaarde({
    employees: resolved.employees,
    fin: resolved.financials,
    historyWeightOverrides: {},
    lastClosedYear: resolved.lastClosedYear,
    nonLegalEntityConfig: resolved.nonLegalEntityConfig,
    normalizations: resolved.normalizations,
    sector: resolved.sector,
    smallEbitdaDeductions,
    smallOrgDeductions,
    valuationMultiples,
    valuationSettings: resolved.valuationSettings,
  })

  const { result } = await getValuationRecord(userId)
  const enterpriseValue =
    indicative.value !== null
      ? indicative.value
      : Math.round(result?.dcfValue ?? 0)

  const adjustment = computeAandeelhouderswaardeVerrekening({
    financials: resolved.financials,
    lastClosedYear: resolved.lastClosedYear,
    shareholderValue: fields.shareholderValue,
  })

  const valuationBand =
    resolved.valuationBand ??
    Math.ceil(enterpriseValue * VALUATION_BAND_DEFAULT_PCT)

  return {
    companyName: company.name,
    description: company.description,
    employees: company.employees,
    enterpriseValue,
    financials: resolved.financials,
    sector: company.sector,
    shareholderValue: enterpriseValue + adjustment,
    usp: company.usp,
    valuationBand,
    valuationReport: fields.valuationReport,
  }
}
