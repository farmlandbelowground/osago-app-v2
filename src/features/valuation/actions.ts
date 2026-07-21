'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { DASHBOARD_PATH } from '@features/auth'
import { getCompany } from '@features/company/queries'
import { runAiCompose } from '@shared/ai-compose/lib/runAiCompose'
import { type ApiResult } from '@shared/api/fetcher'
import { legacyApiFetch } from '@shared/api/legacyApiFetch'
import { requireSession } from '@shared/auth/session'
import { getServerClient } from '@shared/supabase/server'

import {
  FINANCIELE_GEGEVENS_PATH,
  WAARDEBEPALING_PATH,
  WAARDERINGSRAPPORT_PATH,
} from './constants/routes'
import {
  VALUE_DRIVERS,
  VD_PERCENTAGE_SLIDER_STEP,
} from './constants/valueDrivers'
import { buildReportAiPrompt } from './lib/buildReportAiPrompt'
import { buildValuationGammaPrompt } from './lib/buildValuationGammaPrompt'
import { computeAandeelhouderswaardeVerrekening } from './lib/computeAandeelhouderswaardeVerrekening'
import {
  computeHeuristicValuation,
  deriveHeuristicValuationCompanyInputs,
  resolveHeuristicDcfParams,
} from './lib/computeHeuristicValuation'
import {
  getCompanyValuationFields,
  getFinancials,
  getValuationReportGammaInput,
  getValuationRecord,
  isValuationMade,
  resolveDisplayCompanyData,
} from './queries'
import {
  CompanyValuationExtraSchema,
  DcfNewInputsSchema,
  FinancialsExtractionResponseSchema,
  ValuationReportFieldSchema,
  ValueDriverAnswersSchema,
} from './schema'
import {
  type DcfNewInputs,
  type FinancialsExtraction,
  type FinancialYearInput,
  type NonLegalEntityValuation,
  type Normalization,
  type ShareholderValueInputs,
  type ValueDriverAnswers,
  type ValuationReportField,
  type ValuationReview,
  type ValuationSnapshotCompany,
} from './types'

type ActionResult = { error: null } | { error: string }

const getExistingExtra = async (
  userId: string,
): Promise<z.infer<typeof CompanyValuationExtraSchema>> => {
  const supabase = await getServerClient()
  const { data } = await supabase
    .from('companies')
    .select('extra')
    .eq('user_id', userId)
    .maybeSingle()

  const parsed = CompanyValuationExtraSchema.safeParse(data?.extra)
  return parsed.success ? parsed.data : {}
}

interface SaveFinancialsInput {
  autoForecast: boolean
  lastClosedYear: number
  nonLegalEntityValuation: NonLegalEntityValuation
  years: FinancialYearInput[]
}

export const saveFinancials = async (
  input: SaveFinancialsInput,
): Promise<ActionResult> => {
  const session = await requireSession()
  const supabase = await getServerClient()

  const rows = input.years.map(year => ({
    user_id: session.user.id,
    year: year.year,
    revenue: year.revenue,
    cogs: year.cogs,
    operating_expenses: year.operatingExpenses,
    depreciation: year.depreciation,
    interest: year.interest,
    taxes_paid: year.taxesPaid,
  }))

  const { error: finError } = await supabase
    .from('financials')
    .upsert(rows, { onConflict: 'user_id,year' })

  if (finError) {
    return { error: 'Opslaan van de financiële gegevens is mislukt.' }
  }

  const currentExtra = await getExistingExtra(session.user.id)

  const { error: companyError } = await supabase.from('companies').upsert(
    {
      auto_forecast: input.autoForecast,
      extra: {
        ...currentExtra,
        nonLegalEntityValuation: input.nonLegalEntityValuation,
      },
      last_closed_year: input.lastClosedYear,
      user_id: session.user.id,
    },
    { onConflict: 'user_id' },
  )

  if (companyError) {
    return { error: 'Opslaan van de financiële gegevens is mislukt.' }
  }

  revalidatePath(FINANCIELE_GEGEVENS_PATH)
  revalidatePath(WAARDEBEPALING_PATH)
  return { error: null }
}

interface SaveValuationSettingsInput {
  adjustHistoryWeights: boolean
  dcfApplyEnabled: boolean
  forecastIncluded: boolean
  historyIncluded: boolean
  manualMultipleEnabled: boolean
  manualMultipleValue: number | null
}

export const saveValuationSettings = async (
  input: SaveValuationSettingsInput,
): Promise<ActionResult> => {
  const session = await requireSession()
  const supabase = await getServerClient()

  const dcfApplyEnabled = input.dcfApplyEnabled
  const manualMultipleEnabled = dcfApplyEnabled
    ? false
    : input.manualMultipleEnabled

  const currentExtra = await getExistingExtra(session.user.id)

  const { error } = await supabase.from('companies').upsert(
    {
      dcf_apply_enabled: dcfApplyEnabled,
      extra: {
        ...currentExtra,
        manualMultipleEnabled,
        manualMultipleValue: input.manualMultipleValue,
        valuationSettings: {
          adjustHistoryWeights: input.adjustHistoryWeights,
          forecastIncluded: input.forecastIncluded,
          historyIncluded: input.historyIncluded,
        },
      },
      user_id: session.user.id,
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    return { error: 'Opslaan van de waarderingsinstellingen is mislukt.' }
  }

  revalidatePath(FINANCIELE_GEGEVENS_PATH)
  revalidatePath(WAARDEBEPALING_PATH)
  return { error: null }
}

export const saveNormalizations = async (
  normalizations: Normalization[],
): Promise<ActionResult> => {
  const session = await requireSession()
  const supabase = await getServerClient()
  const currentExtra = await getExistingExtra(session.user.id)

  const { error } = await supabase.from('companies').upsert(
    {
      extra: { ...currentExtra, normalizations },
      user_id: session.user.id,
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    return { error: 'Opslaan van de normaliseringen is mislukt.' }
  }

  revalidatePath(FINANCIELE_GEGEVENS_PATH)
  revalidatePath(WAARDEBEPALING_PATH)
  return { error: null }
}

const snapPercentageAnswers = (
  answers: ValueDriverAnswers,
): ValueDriverAnswers => {
  const snapped: ValueDriverAnswers = {}
  for (const [id, value] of Object.entries(answers)) {
    if (value === undefined) {
      continue
    }
    const definition = VALUE_DRIVERS.find(driver => driver.id === id)
    snapped[id as keyof ValueDriverAnswers] =
      definition?.type === 'percentage_slider'
        ? Math.round(value / VD_PERCENTAGE_SLIDER_STEP) *
          VD_PERCENTAGE_SLIDER_STEP
        : value
  }
  return snapped
}

export const saveValueDrivers = async (
  answers: ValueDriverAnswers,
): Promise<ActionResult> => {
  const parsed = ValueDriverAnswersSchema.safeParse(answers)
  if (!parsed.success) {
    return { error: 'Controleer de ingevulde antwoorden.' }
  }

  const session = await requireSession()
  const supabase = await getServerClient()
  const currentExtra = await getExistingExtra(session.user.id)

  const { error } = await supabase.from('companies').upsert(
    {
      extra: { ...currentExtra, valueDrivers: snapPercentageAnswers(answers) },
      user_id: session.user.id,
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    return { error: 'Opslaan van de value drivers is mislukt.' }
  }

  revalidatePath('/value-drivers')
  revalidatePath(WAARDEBEPALING_PATH)
  return { error: null }
}

export const saveShareholderValueInputs = async (
  inputs: ShareholderValueInputs,
): Promise<ActionResult> => {
  const session = await requireSession()
  const supabase = await getServerClient()
  const currentExtra = await getExistingExtra(session.user.id)

  const { error } = await supabase.from('companies').upsert(
    {
      extra: {
        ...currentExtra,
        bedrijfskostenV2: inputs.bedrijfskostenV2,
        crediteurenV2: inputs.crediteurenV2,
        dcfreeExtrasV2: inputs.dcfreeExtrasV2,
        debiteurenV2: inputs.debiteurenV2,
        kortlopendeSchuldenV2: inputs.kortlopendeSchuldenV2,
        kostprijsOmzetV2: inputs.kostprijsOmzetV2,
        lastClosedBalanceYear: inputs.lastClosedBalanceYear,
        liquideMiddelenV2: inputs.liquideMiddelenV2,
        totaleKostenMaandenV2: inputs.totaleKostenMaandenV2,
        vakantiegeldV2: inputs.vakantiegeldV2,
        werkkapitaalExtrasV2: inputs.werkkapitaalExtrasV2,
      },
      user_id: session.user.id,
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    return { error: 'Opslaan van de aandeelhouderswaarde-gegevens is mislukt.' }
  }

  revalidatePath(FINANCIELE_GEGEVENS_PATH)
  revalidatePath(WAARDEBEPALING_PATH)
  return { error: null }
}

export const extractFinancials = async (
  payload: { kind: 'pdf'; dataBase64: string } | { kind: 'text'; text: string },
): Promise<ApiResult<FinancialsExtraction>> =>
  legacyApiFetch('/api/financials/extract', {
    method: 'POST',
    body: JSON.stringify(payload),
    schema: FinancialsExtractionResponseSchema,
  })

const buildValuationSnapshot = async (
  userId: string,
): Promise<ValuationSnapshotCompany | null> => {
  const [company, fields, financialsList] = await Promise.all([
    getCompany(userId),
    getCompanyValuationFields(userId),
    getFinancials(userId),
  ])

  if (!company || !fields) {
    return null
  }

  const financials: Record<number, FinancialYearInput> = {}
  for (const row of financialsList) {
    financials[row.year] = row
  }

  return {
    ...company,
    ...fields.shareholderValue,
    dcfApplyEnabled: fields.dcfApplyEnabled,
    dcfParams: fields.dcfNewInputs,
    financials,
    lastClosedYear: fields.lastClosedYear,
    normalizations: fields.normalizations,
    nonLegalEntityValuation: fields.nonLegalEntityConfig,
    valuationBand: fields.valuationBand,
    valuationSettings: fields.valuationSettings,
    valueDrivers: fields.valueDriverAnswers,
  }
}

export const recomputeHeuristicValuation = async (
  userId: string,
): Promise<ActionResult> => {
  const [{ result: existingResult, dcfParams: storedDcfParams }, resolved] =
    await Promise.all([
      getValuationRecord(userId),
      resolveDisplayCompanyData(userId),
    ])

  if (!resolved) {
    return { error: 'Onvoldoende gegevens om de waardering te herberekenen.' }
  }

  const companyInputs = deriveHeuristicValuationCompanyInputs(
    resolved.financials,
    resolved.lastClosedYear,
    resolved.sector,
    resolved.recurringRevenue,
    resolved.nonLegalEntityConfig,
    resolved.normalizations,
  )

  const params = resolveHeuristicDcfParams(
    companyInputs.revenueGrowth,
    storedDcfParams,
  )
  const heuristicResult = computeHeuristicValuation(companyInputs, params)

  const supabase = await getServerClient()
  const { error } = await supabase.from('valuations').upsert(
    {
      dcf_params: params,
      result: {
        ...existingResult,
        ...heuristicResult,
      },
      user_id: userId,
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    return { error: 'Herberekening van de waardering is mislukt.' }
  }

  return { error: null }
}

const MakeValuationInputSchema = z.object({ agreed: z.literal(true) })

export const makeValuation = async (
  input: z.infer<typeof MakeValuationInputSchema>,
): Promise<ActionResult> => {
  const parsed = MakeValuationInputSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Bevestig eerst dat je akkoord gaat.' }
  }

  const session = await requireSession()
  const userId = session.user.id

  const { result: existingResult } = await getValuationRecord(userId)
  if (isValuationMade(existingResult)) {
    return { error: 'De waardering is al eerder gemaakt.' }
  }

  const snapshotCompany = await buildValuationSnapshot(userId)
  if (!snapshotCompany) {
    return { error: 'Onvoldoende gegevens om een waardering te maken.' }
  }

  const supabase = await getServerClient()
  const { error } = await supabase.from('valuations').upsert(
    {
      result: {
        ...existingResult,
        madeAt: Date.now(),
        snapshotCompany,
      },
      user_id: userId,
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    return { error: 'Waardering maken is mislukt.' }
  }

  revalidatePath(WAARDEBEPALING_PATH)
  return { error: null }
}

export const submitValuationForReview = async (): Promise<ActionResult> => {
  const session = await requireSession()
  const supabase = await getServerClient()
  const currentExtra = await getExistingExtra(session.user.id)
  const currentReview = currentExtra.valuationReview

  if (currentReview?.status === 'submitted') {
    return { error: 'De waardering is al ingediend ter controle.' }
  }
  if (currentReview?.status === 'approved') {
    return { error: 'De waardering is al vrijgeschakeld.' }
  }

  const valuationReview: ValuationReview = {
    status: 'submitted',
    submittedAt: Date.now(),
  }

  const { error } = await supabase.from('companies').upsert(
    {
      extra: { ...currentExtra, valuationReview },
      user_id: session.user.id,
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    return { error: 'Indienen ter controle is mislukt.' }
  }

  revalidatePath(WAARDEBEPALING_PATH)
  return { error: null }
}

export const getShareholderValueAdjustment = async (
  userId: string,
): Promise<number> => {
  const [fields, financialsList] = await Promise.all([
    getCompanyValuationFields(userId),
    getFinancials(userId),
  ])
  if (!fields) {
    return 0
  }
  const financials: Record<number, FinancialYearInput> = Object.fromEntries(
    financialsList.map(row => [row.year, row]),
  )
  return computeAandeelhouderswaardeVerrekening({
    financials,
    lastClosedYear: fields.lastClosedYear ?? new Date().getFullYear() - 1,
    shareholderValue: fields.shareholderValue,
  })
}

export const saveDcfNewInputs = async (
  input: DcfNewInputs,
): Promise<ActionResult> => {
  const parsed = DcfNewInputsSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Controleer de ingevulde DCF-uitgangspunten.' }
  }

  const session = await requireSession()
  const supabase = await getServerClient()

  const { error } = await supabase.from('companies').upsert(
    {
      dcf_new_inputs: parsed.data,
      user_id: session.user.id,
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    return { error: 'Opslaan van de DCF-uitgangspunten is mislukt.' }
  }

  revalidatePath(FINANCIELE_GEGEVENS_PATH)
  revalidatePath(WAARDEBEPALING_PATH)
  return { error: null }
}

export const saveValuationReportField = async (
  field: ValuationReportField,
  value: string,
): Promise<ActionResult> => {
  const parsedField = ValuationReportFieldSchema.safeParse(field)
  if (!parsedField.success) {
    return { error: 'Onbekend veld in het waarderingsrapport.' }
  }

  const session = await requireSession()
  const supabase = await getServerClient()
  const currentExtra = await getExistingExtra(session.user.id)

  const { error } = await supabase.from('companies').upsert(
    {
      extra: {
        ...currentExtra,
        valuationReport: {
          ...currentExtra.valuationReport,
          [parsedField.data]: value,
        },
      },
      user_id: session.user.id,
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    return { error: 'Opslaan van het waarderingsrapport is mislukt.' }
  }

  revalidatePath(WAARDERINGSRAPPORT_PATH)
  revalidatePath(WAARDEBEPALING_PATH)
  revalidatePath(DASHBOARD_PATH)
  return { error: null }
}

const ComposeReportTextInputSchema = z.object({
  action: z.enum(['generate', 'rewrite']),
  field: ValuationReportFieldSchema,
  length: z.enum(['short', 'normal', 'long']),
  instruction: z.string().optional(),
  currentValue: z.string().optional(),
})

export const composeReportText = async (
  input: z.infer<typeof ComposeReportTextInputSchema>,
): Promise<ApiResult<{ text: string }>> => {
  const parsed = ComposeReportTextInputSchema.safeParse(input)
  if (!parsed.success) {
    return { data: null, error: 'Ongeldige invoer voor de AI-tekst.' }
  }

  const session = await requireSession()
  const userId = session.user.id

  const [company, fields, financialsList] = await Promise.all([
    getCompany(userId),
    getCompanyValuationFields(userId),
    getFinancials(userId),
  ])

  if (!company || !fields) {
    return { data: null, error: 'Onvoldoende gegevens om tekst te genereren.' }
  }

  const financials: Record<number, FinancialYearInput> = Object.fromEntries(
    financialsList.map(row => [row.year, row]),
  )
  const lastClosedYear = fields.lastClosedYear ?? new Date().getFullYear() - 1
  const revenue = financials[lastClosedYear]?.revenue ?? null

  const { maxTokens, model, prompt } = buildReportAiPrompt({
    action: parsed.data.action,
    company,
    currentValue: parsed.data.currentValue ?? '',
    field: parsed.data.field,
    instruction: parsed.data.instruction ?? '',
    length: parsed.data.length,
    revenue,
    savedReport: fields.valuationReport,
  })

  return runAiCompose({ maxTokens, model, prompt })
}

// Ports the pre-flight + prompt build of generateValuationViaGamma
// (osago-bundle.js:19913-19938). The valuation must be made first; the shared
// Gamma flow (client) then runs the generation with variant 'valuation'.
export const prepareValuationReportGamma = async (): Promise<
  ApiResult<{
    description: string
    fileName: string
    inputText: string
    numCards: number
  }>
> => {
  const session = await requireSession()
  const userId = session.user.id

  const { result } = await getValuationRecord(userId)
  if (!isValuationMade(result)) {
    return {
      data: null,
      error:
        'Klik eerst op "Waardering maken" voordat je het rapport genereert.',
    }
  }

  const input = await getValuationReportGammaInput(userId)
  if (!input) {
    return {
      data: null,
      error: 'Onvoldoende gegevens om het rapport te genereren.',
    }
  }

  const built = buildValuationGammaPrompt(input)
  const stamp = new Date().toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return {
    data: {
      description:
        'Indicatief waarderingsrapport — bewerkbaar PowerPoint-bestand, controleer en pas aan waar nodig.',
      fileName: `Waarderingsrapport ${stamp}.pptx`,
      inputText: built.text,
      numCards: built.slideCount,
    },
    error: null,
  }
}
