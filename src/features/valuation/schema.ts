import { z } from 'zod'

// ─── Supabase `financials` — direct read/write ───

export const FinancialsRowSchema = z.object({
  year: z.number().int(),
  revenue: z.number().nullable(),
  cogs: z.number().nullable(),
  operating_expenses: z.number().nullable(),
  depreciation: z.number().nullable(),
  interest: z.number().nullable(),
  taxes_paid: z.number().nullable(),
})

export type FinancialsRow = z.infer<typeof FinancialsRowSchema>

// ─── `companies.extra` jsonb catch-all fields owned by this feature ───

export const NormalizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number(),
  years: z.array(z.number().int()).nullish(),
})

export const ValueDriverAnswersSchema = z.record(
  z.string().regex(/^q([1-9]|1\d|2[0-7])$/),
  z.number(),
)

export const ValuationSettingsSchema = z.object({
  historyIncluded: z.boolean(),
  adjustHistoryWeights: z.boolean(),
  forecastIncluded: z.boolean(),
  dcfApplyEnabled: z.boolean(),
  manualMultipleEnabled: z.boolean(),
  manualMultipleValue: z.number().nullable(),
})

export const NonLegalEntityValuationSchema = z.object({
  hasFixedIncome: z.boolean(),
  hoursPerWeek: z.number().nullable(),
  partnerCount: z.number().nullable(),
})

// ─── frozen `api/financials/extract` response contract ───

export const FinancialsExtractionYearSchema = z.object({
  year: z.number().int(),
  revenue: z.number().nullable(),
  cogs: z.number().nullable(),
  operatingExpenses: z.number().nullable(),
  depreciation: z.number().nullable(),
  interest: z.number().nullable(),
  taxesPaid: z.number().nullable(),
})

export const FinancialsExtractionResponseSchema = z.object({
  years: z.array(FinancialsExtractionYearSchema),
  currencyNote: z.string(),
  confidence: z.enum(['hoog', 'gemiddeld', 'laag']),
})

// ─── `app_config` reads ───

export const ValuationMultipleSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.number(),
  sectoropslag: z.number().optional(),
})

export const AppConfigValuationMultiplesSchema = z.array(
  ValuationMultipleSchema,
)

export const AppConfigDcfAdminDefaultsSchema = z.object({
  rfr: z.number(),
  mrp: z.number(),
  liquiditeitspremie: z.number(),
})

export const EbitdaDeductionRangeSchema = z.object({
  fromEbitda: z.number().nullable(),
  toEbitda: z.number().nullable(),
  deduction: z.number(),
})

export const AppConfigSmallEbitdaDeductionsSchema = z.array(
  EbitdaDeductionRangeSchema,
)

export const OrgDeductionRangeSchema = z.object({
  fromFte: z.number().nullable(),
  toFte: z.number().nullable(),
  deduction: z.number(),
})

export const AppConfigSmallOrgDeductionsSchema = z.array(
  OrgDeductionRangeSchema,
)

export const WorkingCapitalExtraItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  amount: z.number(),
})

// ─── `public.valuations` — lock-in record ───

export const ValuationDcfRowSchema = z.object({
  year: z.number().int(),
  growth: z.number(),
  cashflow: z.number(),
  discountFactor: z.number(),
  pv: z.number(),
})

export const ValuationDriverSchema = z.object({
  label: z.string(),
  note: z.string(),
  impact: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
  impactLabel: z.string(),
})

export const ValuationResultRecordSchema = z
  .object({
    madeAt: z.number().nullable(),
    snapshotCompany: z.unknown().nullable(),
    low: z.number(),
    high: z.number(),
    midpoint: z.number(),
    dcfValue: z.number(),
    ebitdaValue: z.number(),
    revenueValue: z.number(),
    ebitdaMultiple: z.number(),
    revenueMultiple: z.number(),
    baseEbitdaMultiple: z.number(),
    terminalCashflow: z.number(),
    terminalPv: z.number(),
    terminalGrowthUsed: z.number(),
    calculatedAt: z.number(),
    dcfRows: z.array(ValuationDcfRowSchema),
    drivers: z.array(ValuationDriverSchema),
  })
  .partial({ madeAt: true, snapshotCompany: true })

export type ValuationResultRecordRow = z.infer<
  typeof ValuationResultRecordSchema
>

export const ValuationDcfParamsSchema = z.object({
  discountRate: z.number(),
  initialGrowth: z.number(),
  terminalGrowth: z.number(),
  projectionYears: z.number(),
  growthFade: z.number(),
})

// ─── `companies.extra.valuationReview` ───

export const ValuationReviewSchema = z.object({
  status: z.union([z.literal('submitted'), z.literal('approved')]),
  submittedAt: z.number(),
  approvedAt: z.number().optional(),
  approvedBy: z.string().optional(),
})

// ─── `companies.extra.valuationReport` — the four free-text fields ───

export const ValuationReportSchema = z.object({
  foreword: z.string().optional(),
  financialsNote: z.string().optional(),
  valueDriversNote: z.string().optional(),
  closing: z.string().optional(),
})

export const ValuationReportFieldSchema = z.enum([
  'foreword',
  'financialsNote',
  'valueDriversNote',
  'closing',
])

// ─── `companies.dcf_new_inputs` (promoted jsonb, migration 0008) ───

const RiskFactorInputSchema = z.object({
  waarde: z.number(),
  midPct: z.number(),
})

export const DcfNewUitgangspuntenSchema = z.object({
  vermogensvoetRest: z.number(),
  groeiRest: z.number(),
  restwaardeCap: z.boolean(),
})

export const DcfNewInputsSchema = z.object({
  ip: z.number(),
  klein: z.object({
    adh: RiskFactorInputSchema,
    afn: RiskFactorInputSchema,
    alr: RiskFactorInputSchema,
  }),
  asset: z.object({
    rep: RiskFactorInputSchema,
    act: RiskFactorInputSchema,
    toetr: RiskFactorInputSchema,
    trackR: RiskFactorInputSchema,
  }),
  scenarioStartYear: z.number().int(),
  scenarioYearCount: z.number().int(),
  investeringen: z.record(z.string(), z.number()),
  aflossingen: z.record(z.string(), z.number()),
  uitgangspunten: DcfNewUitgangspuntenSchema,
})

// ─── `companies` — the subset of promoted columns + `extra` keys this ───
// ─── feature owns, read alongside (not instead of) features/company's own ───
// ─── narrower `getCompany()` select. ───

export const CompanyValuationExtraSchema = z
  .object({
    normalizations: z.array(NormalizationSchema).optional(),
    valueDrivers: ValueDriverAnswersSchema.optional(),
    valuationSettings: z
      .object({
        historyIncluded: z.boolean().optional(),
        adjustHistoryWeights: z.boolean().optional(),
        forecastIncluded: z.boolean().optional(),
      })
      .optional(),
    manualMultipleEnabled: z.boolean().optional(),
    manualMultipleValue: z.number().nullable().optional(),
    nonLegalEntityValuation: NonLegalEntityValuationSchema.optional(),
    valuationReview: ValuationReviewSchema.optional(),
    valuationReport: ValuationReportSchema.optional(),
    kostprijsOmzetV2: z.number().nullable().optional(),
    lastClosedBalanceYear: z.number().int().nullable().optional(),
    bedrijfskostenV2: z.number().nullable().optional(),
    totaleKostenMaandenV2: z.number().nullable().optional(),
    debiteurenV2: z.number().nullable().optional(),
    crediteurenV2: z.number().nullable().optional(),
    werkkapitaalExtrasV2: z.array(WorkingCapitalExtraItemSchema).optional(),
    liquideMiddelenV2: z.number().nullable().optional(),
    vakantiegeldV2: z.number().nullable().optional(),
    kortlopendeSchuldenV2: z.number().nullable().optional(),
    dcfreeExtrasV2: z.array(WorkingCapitalExtraItemSchema).optional(),
  })
  .passthrough()

export const CompanyValuationRowSchema = z.object({
  auto_forecast: z.boolean(),
  dcf_apply_enabled: z.boolean().nullable(),
  dcf_new_inputs: DcfNewInputsSchema.nullable(),
  extra: CompanyValuationExtraSchema,
  last_closed_year: z.number().int().nullable(),
  valuation_band: z.number().nullable(),
})

export type CompanyValuationRow = z.infer<typeof CompanyValuationRowSchema>
