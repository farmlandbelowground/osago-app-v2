import { type Company } from '@features/company/types'

export interface FinancialYearInput {
  cogs: number | null
  depreciation: number | null
  interest: number | null
  operatingExpenses: number | null
  revenue: number | null
  taxesPaid: number | null
  year: number
  // Per-year EBITDA weighting override (0–5) persisted on financials.history_weight.
  // Optional: rows constructed before this field existed simply omit it.
  historyWeight?: number | null
}

export interface FinancialYearDerived extends FinancialYearInput {
  ebitda: number | null
  grossProfit: number | null
  normalizationsApplied: number
  profitBeforeTax: number | null
}

export interface Normalization {
  amount: number
  id: string
  name: string
  years: number[] | null
}

export interface NonLegalEntityValuation {
  hasFixedIncome: boolean
  hoursPerWeek: number | null
  partnerCount: number | null
}

export interface ValuationSettings {
  adjustHistoryWeights: boolean
  dcfApplyEnabled: boolean
  forecastIncluded: boolean
  historyIncluded: boolean
  manualMultipleEnabled: boolean
  manualMultipleValue: number | null
}

export type ValueDriverAnswers = Partial<Record<`q${number}`, number>>

export interface ValueDriverSectionScore {
  answeredCount: number
  score: number | null
  title: string
  totalCount: number
}

export interface FinancialsExtraction {
  confidence: 'hoog' | 'gemiddeld' | 'laag'
  currencyNote: string
  years: FinancialYearInput[]
}

export interface ValuationMultiple {
  id: string
  label: string
  value: number
  sectoropslag?: number
}

export interface DcfAdminDefaults {
  liquiditeitspremie: number
  mrp: number
  rfr: number
}

export interface EbitdaDeductionRange {
  deduction: number
  fromEbitda: number | null
  toEbitda: number | null
}

export interface OrgDeductionRange {
  deduction: number
  fromFte: number | null
  toFte: number | null
}

export interface ValuationDcfRow {
  cashflow: number
  discountFactor: number
  growth: number
  pv: number
  year: number
}

export interface ValuationDriver {
  impact: -1 | 0 | 1
  impactLabel: string
  label: string
  note: string
}

export interface RiskFactorInput {
  midPct: number
  waarde: number
}

export interface DcfNewUitgangspunten {
  groeiRest: number
  restwaardeCap: boolean
  vermogensvoetRest: number
}

export interface DcfNewInputs {
  aflossingen: Record<number, number>
  asset: {
    rep: RiskFactorInput
    act: RiskFactorInput
    toetr: RiskFactorInput
    trackR: RiskFactorInput
  }
  investeringen: Record<number, number>
  ip: number
  klein: {
    adh: RiskFactorInput
    afn: RiskFactorInput
    alr: RiskFactorInput
  }
  scenarioStartYear: number
  scenarioYearCount: number
  uitgangspunten: DcfNewUitgangspunten
}

export interface DcfNewResolvedInputs extends DcfNewInputs {
  mrp: number
  rfr: number
  sectoropslag: number
}

export interface DcfNewBerekeningRow {
  aflossingen: number
  afschrijvingen: number
  cw: number | null
  df: number | null
  ebit: number
  ebitda: number
  fcf: number
  intrest: number
  investeringen: number
  nettoResultaat: number
  nettoResultaatGenorm: number
  noplat: number
  normalisering: number
  revenue: number
  type: 'hist' | 'scen' | 'rest'
  vpb: number
}

export interface DcfNewBerekeningResult {
  data: Record<number, DcfNewBerekeningRow>
  historicalYears: number[]
  restYear: number
  scenarioYears: number[]
  totalen: { waardeScenario: number; waardeRest: number; totaal: number }
}

export interface DcfNewComputeResult {
  alfa: number
  asset: { rep: number; act: number; toetr: number; trackR: number }
  berekening: DcfNewBerekeningResult
  discRows: Array<{ year: number; n: number; df: number }>
  klein: { adh: number; afn: number; alr: number }
  kleinPremie: number
  kostenvoet: number
  restDf: number
  subtotaal1: number
}

export interface WorkingCapitalExtraItem {
  amount: number
  id: string
  label: string
}

export interface ShareholderValueInputs {
  bedrijfskostenV2: number | null
  crediteurenV2: number | null
  dcfreeExtrasV2: WorkingCapitalExtraItem[]
  debiteurenV2: number | null
  kortlopendeSchuldenV2: number | null
  kostprijsOmzetV2: number | null
  lastClosedBalanceYear: number | null
  liquideMiddelenV2: number | null
  totaleKostenMaandenV2: number | null
  vakantiegeldV2: number | null
  werkkapitaalExtrasV2: WorkingCapitalExtraItem[]
}

export interface ShareholderValueBreakdown {
  dcfree: number
  positieWerkkap: number
  total: number
  totaleKosten: number
  werkkapitaal: number
}

export interface ValuationSettingsFlags {
  adjustHistoryWeights: boolean
  forecastIncluded: boolean
  historyIncluded: boolean
}

export interface EbitdaYearPoint {
  ebitda: number | null
  isFuture: boolean
  weight: number
  year: number
}

export interface IndicativeEnterpriseValueResult {
  ebitdaPerYear: EbitdaYearPoint[]
  ebitdaSource: 'lastYear' | 'weighted' | 'forecast' | null
  ebitdaUsed: number | null
  ebitdaUsedFallback: boolean
  error: string | null
  sectorLabel: string | null
  sectorMultipleAdjusted: number | null
  sectorMultipleRaw: number | null
  smallEbitdaApplied: EbitdaDeductionRange | null
  smallOrgApplied: OrgDeductionRange | null
  valuationSettings: ValuationSettingsFlags | null
  value: number | null
  manualMultipleUsed?: number
  nonLegalEntityAddon?: number
  normalizationsPerYear?: Record<number, number>
}

export interface HeuristicValuationCompanyInputs {
  ebitda: number | null
  recurringRevenue: number | null
  revenue: number | null
  revenueGrowth: number | null
  sector: string
}

export interface ValuationSnapshotCompany
  extends Company, ShareholderValueInputs {
  dcfApplyEnabled: boolean
  dcfParams: DcfNewInputs
  financials: Record<number, FinancialYearInput>
  lastClosedYear: number | null
  nonLegalEntityValuation: NonLegalEntityValuation | null
  normalizations: Normalization[]
  valuationBand: number | null
  valuationSettings: ValuationSettings
  valueDrivers: ValueDriverAnswers
}

export interface ValuationResultRecord {
  baseEbitdaMultiple: number
  calculatedAt: number
  dcfRows: ValuationDcfRow[]
  dcfValue: number
  drivers: ValuationDriver[]
  ebitdaMultiple: number
  ebitdaValue: number
  high: number
  low: number
  madeAt: number | null
  midpoint: number
  revenueMultiple: number
  revenueValue: number
  snapshotCompany: ValuationSnapshotCompany | null
  terminalCashflow: number
  terminalGrowthUsed: number
  terminalPv: number
}

export interface ValuationDcfParams {
  discountRate: number
  growthFade: number
  initialGrowth: number
  projectionYears: number
  terminalGrowth: number
}

export interface ValuationReview {
  status: 'submitted' | 'approved'
  submittedAt: number
  approvedAt?: number
  approvedBy?: string
}

export interface ValuationProgress {
  financialsAnyValue: boolean
  hasValuationPdfInVault: boolean
  valuationMade: boolean
  valuationReportStarted: boolean
  valueDriversComplete: boolean
}

export interface ValuationReportPresence {
  closing?: string
  financialsNote?: string
  foreword?: string
  valueDriversNote?: string
}

export type ValuationReportField =
  'foreword' | 'financialsNote' | 'valueDriversNote' | 'closing'

export interface ValuationReportContent {
  closing: string
  financialsNote: string
  foreword: string
  valueDriversNote: string
}

export type AiComposeAction = 'generate' | 'rewrite'

export type AiComposeLength = 'short' | 'normal' | 'long'
