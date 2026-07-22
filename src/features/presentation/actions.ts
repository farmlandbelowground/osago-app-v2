'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { getCompany } from '@features/company/queries'
import {
  DOCUMENT_PREFIXES,
  DOCUMENTENKLUIS_PATH,
  documentExistsByPrefix,
} from '@features/documents'
import { DOCS_BUCKET } from '@features/documents/constants/storage'
import { getSubscription } from '@features/subscriptions/queries'
import { getCompanyValuationFields, getFinancials } from '@features/valuation'
import { type FinancialYearInput } from '@features/valuation/types'
import {
  ADMIN_RESET_CONFIG,
  createAdminResetInvoice,
} from '@shared/admin-reset'
import { AI_PATTERN_CATALOG } from '@shared/ai-compose/constants'
import { buildAiComposePrompt } from '@shared/ai-compose/lib/buildAiComposePrompt'
import { runAiCompose } from '@shared/ai-compose/lib/runAiCompose'
import { type ApiResult } from '@shared/api/fetcher'
import { legacyApiFetch } from '@shared/api/legacyApiFetch'
import { requireImpersonation } from '@shared/auth/guards'
import { requireSession } from '@shared/auth/session'
import { sendTemplatedEmail } from '@shared/email'
import { getServerClient } from '@shared/supabase/server'

import {
  ANONIEM_RESET_NOTICE,
  GAMMA_DOC_DESCRIPTION,
  GAMMA_DOC_TITLE_NOUN,
  INTERNAL_NOTIFICATION_EMAIL,
  MEMORANDUM_RESET_NOTICE,
  PRESENTATION_AI_DOC_TYPE,
  PRESENTATION_SAME_FIELDSET_LABEL,
  REGEN_DOC_FEE,
  REGEN_DOC_INFO,
} from './constants/presentation'
import {
  UNSPLASH_SEARCH_ENDPOINT,
  VERKOOPPRESENTATIE_PATH,
} from './constants/routes'
import { buildPresentationGammaPrompt } from './lib/buildPresentationGammaPrompt'
import {
  findPresentationFieldTab,
  isPresentationFieldKey,
  resolvePresentationFieldPattern,
} from './lib/presentationTabs'
import { getMemorandumValuationFigures, getPresentationData } from './queries'
import {
  PresentationExtraSchema,
  PresentationPhotoSchema,
  UnsplashSearchResponseSchema,
} from './schema'
import {
  type PresentationExtra,
  type PresentationGenerateVariant,
  type PresentationReview,
  type RegenerateDocumentType,
  type UnsplashSearchResult,
} from './types'

type ActionResult = { error: null } | { error: string }

const getExistingExtra = async (userId: string): Promise<PresentationExtra> => {
  const supabase = await getServerClient()
  const { data } = await supabase
    .from('companies')
    .select('extra')
    .eq('user_id', userId)
    .maybeSingle()

  const parsed = PresentationExtraSchema.safeParse(data?.extra)
  return parsed.success ? parsed.data : {}
}

const upsertExtra = async (
  userId: string,
  extra: PresentationExtra,
): Promise<boolean> => {
  const supabase = await getServerClient()
  const { error } = await supabase
    .from('companies')
    .upsert({ extra, user_id: userId }, { onConflict: 'user_id' })
  return !error
}

// Ports savePresentationField (osago-bundle.js:21321-21327).
export const savePresentationField = async (
  key: string,
  value: string,
): Promise<ActionResult> => {
  if (!isPresentationFieldKey(key)) {
    return { error: 'Onbekend veld.' }
  }

  const session = await requireSession()
  const currentExtra = await getExistingExtra(session.user.id)

  const saved = await upsertExtra(session.user.id, {
    ...currentExtra,
    presentationFields: { ...currentExtra.presentationFields, [key]: value },
  })

  if (!saved) {
    return { error: 'Opslaan is mislukt.' }
  }

  revalidatePath(VERKOOPPRESENTATIE_PATH)
  return { error: null }
}

// Bulk per-tab save (ports savePresExtTab :19142-19151): flush every field in
// the panel at once.
export const savePresentationTab = async (
  values: Record<string, string>,
): Promise<ActionResult> => {
  const parsed = z.record(z.string(), z.string()).safeParse(values)
  if (!parsed.success) {
    return { error: 'Controleer de ingevulde velden.' }
  }

  const cleaned: Record<string, string> = {}
  for (const [key, value] of Object.entries(parsed.data)) {
    if (isPresentationFieldKey(key)) {
      cleaned[key] = value
    }
  }

  const session = await requireSession()
  const currentExtra = await getExistingExtra(session.user.id)

  const saved = await upsertExtra(session.user.id, {
    ...currentExtra,
    presentationFields: { ...currentExtra.presentationFields, ...cleaned },
  })

  if (!saved) {
    return { error: 'Opslaan is mislukt.' }
  }

  revalidatePath(VERKOOPPRESENTATIE_PATH)
  return { error: null }
}

// Ports savePresExtPhotos (osago-bundle.js:18639-18645).
export const savePresentationPhotos = async (
  tabId: string,
  photos: unknown,
): Promise<ActionResult> => {
  const parsed = z.array(PresentationPhotoSchema).safeParse(photos)
  if (!parsed.success) {
    return { error: 'Foto opslaan is mislukt.' }
  }

  const session = await requireSession()
  const currentExtra = await getExistingExtra(session.user.id)

  const saved = await upsertExtra(session.user.id, {
    ...currentExtra,
    presentationImages: {
      ...currentExtra.presentationImages,
      [tabId]: parsed.data,
    },
  })

  if (!saved) {
    return { error: 'Foto opslaan is mislukt.' }
  }

  revalidatePath(VERKOOPPRESENTATIE_PATH)
  return { error: null }
}

// Ports togglePresExtTab (osago-bundle.js:18876-18883).
export const togglePresentationTab = async (
  tabId: string,
  visible: boolean,
): Promise<ActionResult> => {
  const session = await requireSession()
  const currentExtra = await getExistingExtra(session.user.id)

  const hidden = (currentExtra.presentationTabsHidden ?? []).filter(
    id => id !== tabId,
  )
  if (!visible) {
    hidden.push(tabId)
  }

  const saved = await upsertExtra(session.user.id, {
    ...currentExtra,
    presentationTabsHidden: hidden,
  })

  if (!saved) {
    return { error: 'Opslaan is mislukt.' }
  }

  revalidatePath(VERKOOPPRESENTATIE_PATH)
  return { error: null }
}

// Ports togglePresExtIncludeValuation (osago-bundle.js:18936-18940). Stored but
// not consulted by the prompt builder (OQ-3).
export const togglePresentationIncludeValuation = async (
  value: boolean,
): Promise<ActionResult> => {
  const session = await requireSession()
  const currentExtra = await getExistingExtra(session.user.id)

  const saved = await upsertExtra(session.user.id, {
    ...currentExtra,
    presentationIncludeValuation: value,
  })

  if (!saved) {
    return { error: 'Opslaan is mislukt.' }
  }

  revalidatePath(VERKOOPPRESENTATIE_PATH)
  return { error: null }
}

// Ports submitPresentationForReview (osago-bundle.js:19334-19381). The
// deliverTemplatedEmail send is deferred to Slice 13 (§1.2); the status write +
// the confirmation modal (client) are the customer-facing behavior.
export const submitPresentationForReview = async (): Promise<ActionResult> => {
  const session = await requireSession()
  const userId = session.user.id

  const subscription = await getSubscription(userId)
  const plan = subscription?.type
  if (plan !== 'plus' && plan !== 'premium') {
    return {
      error:
        'Indienen ter controle is alleen beschikbaar voor Plus- en Premium-abonnementen.',
    }
  }

  const currentExtra = await getExistingExtra(userId)
  const status = currentExtra.presentationReview?.status
  if (status === 'submitted') {
    return { error: 'Je presentatie is al ingediend ter controle.' }
  }
  if (status === 'approved') {
    return { error: 'Je presentatie is al vrijgeschakeld.' }
  }

  const review: PresentationReview = {
    status: 'submitted',
    submittedAt: Date.now(),
  }

  const saved = await upsertExtra(userId, {
    ...currentExtra,
    presentationReview: review,
  })

  if (!saved) {
    return { error: 'Indienen ter controle is mislukt.' }
  }

  // Slice-13 wiring of the internal notification Slice 9 stubbed (best-effort;
  // a disabled/missing template is a deliberate no-op).
  const company = await getCompany(userId)
  await sendTemplatedEmail(
    'presentation_review_submitted_internal',
    INTERNAL_NOTIFICATION_EMAIL,
    {
      achternaam: session.lastName ?? '',
      bedrijfsnaam: company?.name ?? '',
      email: session.user.email ?? '',
      pakket: plan,
      voornaam: session.firstName ?? '',
    },
  )

  revalidatePath(VERKOOPPRESENTATIE_PATH)
  return { error: null }
}

const ComposePresentationTextInputSchema = z.object({
  action: z.enum(['generate', 'rewrite']),
  field: z.string(),
  length: z.enum(['short', 'normal', 'long']),
  instruction: z.string().optional(),
  currentValue: z.string().optional(),
})

// Ports the pres-ext half of callAiForField (osago-bundle.js:16162-16220) via
// the shared compose core. Same-tab filled fields feed the context; the field's
// pattern comes from the presentation catalog (spec §3.8).
export const composePresentationText = async (
  input: z.infer<typeof ComposePresentationTextInputSchema>,
): Promise<ApiResult<{ text: string }>> => {
  const parsed = ComposePresentationTextInputSchema.safeParse(input)
  if (!parsed.success || !isPresentationFieldKey(parsed.data.field)) {
    return { data: null, error: 'Ongeldige invoer voor de AI-tekst.' }
  }

  const field = parsed.data.field
  const session = await requireSession()
  const userId = session.user.id

  const [company, presentation, valuationFields, financialsList] =
    await Promise.all([
      getCompany(userId),
      getPresentationData(userId),
      getCompanyValuationFields(userId),
      getFinancials(userId),
    ])

  if (!company) {
    return { data: null, error: 'Onvoldoende gegevens om tekst te genereren.' }
  }

  const financials: Record<number, FinancialYearInput> = Object.fromEntries(
    financialsList.map(row => [row.year, row]),
  )
  const lastClosedYear =
    valuationFields?.lastClosedYear ?? new Date().getFullYear() - 1
  const revenue = financials[lastClosedYear]?.revenue ?? null

  const tab = findPresentationFieldTab(field)
  const fieldDef = tab?.fields.find(candidate => candidate.key === field)
  const sameFieldsetContext = (tab?.fields ?? [])
    .filter(
      candidate =>
        candidate.key !== field &&
        (presentation.fields[candidate.key] ?? '').trim() !== '',
    )
    .map(candidate => ({
      label: candidate.label,
      value: (presentation.fields[candidate.key] ?? '').trim(),
    }))

  const { maxTokens, model, prompt } = buildAiComposePrompt({
    action: parsed.data.action,
    company,
    currentValue: parsed.data.currentValue ?? '',
    docType: PRESENTATION_AI_DOC_TYPE,
    fieldTitle: fieldDef?.label ?? 'tekstveld',
    instruction: parsed.data.instruction ?? '',
    length: parsed.data.length,
    pattern: AI_PATTERN_CATALOG[resolvePresentationFieldPattern(field)],
    revenue,
    sameFieldsetContext,
    sameFieldsetLabel: PRESENTATION_SAME_FIELDSET_LABEL,
  })

  return runAiCompose({ maxTokens, model, prompt })
}

const formatDateStamp = (): string =>
  new Date().toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

export interface PreparedGammaInput {
  description: string
  fileName: string
  inputText: string
  numCards: number
}

// Builds the memorandum/teaser dossier prompt from fresh DB state at click time
// (mirrors legacy generateViaGamma rebuilding the prompt on demand), plus the
// one-time-action guard the confirm modal enforces (osago-bundle.js:19487).
export const preparePresentationGamma = async (
  variant: PresentationGenerateVariant,
): Promise<ApiResult<PreparedGammaInput>> => {
  const session = await requireSession()
  const userId = session.user.id

  const prefix =
    variant === 'memorandum'
      ? DOCUMENT_PREFIXES.memorandum
      : DOCUMENT_PREFIXES.anonymousProfile

  if (await documentExistsByPrefix(userId, [prefix])) {
    return {
      data: null,
      error:
        variant === 'memorandum'
          ? 'Het verkoopmemorandum staat al in jouw Documentenkluis.'
          : 'Het anoniem verkoopprofiel staat al in jouw Documentenkluis.',
    }
  }

  const [company, presentation, financialsList, valuation] = await Promise.all([
    getCompany(userId),
    getPresentationData(userId),
    getFinancials(userId),
    getMemorandumValuationFigures(userId),
  ])

  if (!company) {
    return {
      data: null,
      error: 'Onvoldoende gegevens om het document te genereren.',
    }
  }

  const financials: Record<number, FinancialYearInput> = Object.fromEntries(
    financialsList.map(row => [row.year, row]),
  )

  const built = buildPresentationGammaPrompt(variant, {
    city: company.city,
    companyName: company.name,
    description: company.description,
    employees: company.employees,
    fields: presentation.fields,
    financials,
    founded: company.founded,
    legalForm: company.legalForm,
    reasonForSale: company.reasonForSale,
    recurringRevenue: company.recurringRevenue,
    sector: company.sector,
    usp: company.usp,
    valuation,
  })

  const fileName = `${GAMMA_DOC_TITLE_NOUN[variant]} ${formatDateStamp()}.pptx`

  return {
    data: {
      description: GAMMA_DOC_DESCRIPTION,
      fileName,
      inputText: built.text,
      numCards: built.slideCount,
    },
    error: null,
  }
}

// Client-reactive Unsplash search (spec §3.5) — routed through the query layer
// and Zod-validated per rules/api.md. The endpoint is unauthenticated.
export const searchUnsplash = async (
  query: string,
): Promise<ApiResult<UnsplashSearchResult[]>> => {
  const trimmed = query.trim()
  if (!trimmed) {
    return { data: [], error: null }
  }

  const result = await legacyApiFetch<{ results: UnsplashSearchResult[] }>(
    `${UNSPLASH_SEARCH_ENDPOINT}?q=${encodeURIComponent(trimmed)}`,
    { schema: UnsplashSearchResponseSchema },
  )

  if (result.error !== null) {
    return { data: null, error: result.error }
  }

  return { data: result.data.results, error: null }
}

// ─────────────────────────────────────────────────────────────────────────
// Slice 13 Part C — employee-only ("medewerker") presentation tools. These
// render + run only while an Osago employee is impersonating the customer
// (requireImpersonation → session IS the customer, own-row RLS). Ports
// approvePresentationReviewByAdmin + the memorandum/anoniem admin-resets
// (osago-bundle.js:19384-19419, 12514-12652).
// ─────────────────────────────────────────────────────────────────────────

type ResetResult = { invoiceError: string | null }

// Vault removal done inline (features/documents has no delete-by-prefix helper
// and is concurrently edited elsewhere). Under impersonation the session is the
// customer, so deleting their own documents + storage objects is RLS-allowed.
const removeVaultDocsByPrefix = async (
  userId: string,
  prefixes: string[],
): Promise<void> => {
  const supabase = await getServerClient()
  const { data } = await supabase
    .from('documents')
    .select('id, file_name, file_path')
    .eq('user_id', userId)

  const matches = (data ?? []).filter(
    (row: { file_name: string | null }) =>
      typeof row.file_name === 'string' &&
      prefixes.some(prefix => row.file_name?.startsWith(prefix)),
  )

  if (matches.length === 0) {
    return
  }

  const paths = matches
    .map((row: { file_path: string | null }) => row.file_path)
    .filter((path): path is string => Boolean(path))

  if (paths.length > 0) {
    await supabase.storage.from(DOCS_BUCKET).remove(paths)
  }

  await supabase
    .from('documents')
    .delete()
    .in(
      'id',
      matches.map((row: { id: string }) => row.id),
    )

  revalidatePath(DOCUMENTENKLUIS_PATH)
}

const resetDateStamp = (): string =>
  new Date().toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

export const approvePresentationReviewByAdmin =
  async (): Promise<ActionResult> => {
    const session = await requireImpersonation()
    const userId = session.user.id

    const subscription = await getSubscription(userId)
    const plan = subscription?.type
    if (plan !== 'plus' && plan !== 'premium') {
      return {
        error:
          'Vrijschakelen is alleen van toepassing op Plus- en Premium-abonnementen.',
      }
    }

    const currentExtra = await getExistingExtra(userId)
    const status = currentExtra.presentationReview?.status
    if (status !== 'submitted') {
      return {
        error:
          status === 'approved'
            ? 'Presentatie is al vrijgeschakeld.'
            : 'Er is geen presentatie ingediend ter controle.',
      }
    }

    const review: PresentationReview = {
      approvedAt: Date.now(),
      approvedBy: session.impersonatedBy ?? undefined,
      status: 'approved',
      submittedAt: currentExtra.presentationReview?.submittedAt ?? Date.now(),
    }

    const saved = await upsertExtra(userId, {
      ...currentExtra,
      presentationReview: review,
    })

    if (!saved) {
      return { error: 'Vrijschakelen is mislukt.' }
    }

    const company = await getCompany(userId)
    await sendTemplatedEmail(
      'presentation_review_approved',
      session.user.email ?? '',
      {
        achternaam: session.lastName ?? '',
        bedrijfsnaam: company?.name ?? '',
        voornaam: session.firstName ?? '',
      },
    )

    revalidatePath(VERKOOPPRESENTATIE_PATH)
    return { error: null }
  }

const sendAdminResetNotice = async (
  session: Awaited<ReturnType<typeof requireImpersonation>>,
  notice: { onderdeel: string; onderdeelLc: string; toelichting: string },
): Promise<void> => {
  await sendTemplatedEmail('admin_reset_notice', session.user.email ?? '', {
    achternaam: session.lastName ?? '',
    onderdeel: notice.onderdeel,
    onderdeel_lc: notice.onderdeelLc,
    reset_datum: resetDateStamp(),
    toelichting: notice.toelichting,
    voornaam: session.firstName ?? '',
  })
}

export const resetMemorandumByAdmin = async (
  withInvoice: boolean,
): Promise<ResetResult> => {
  const session = await requireImpersonation()

  await removeVaultDocsByPrefix(session.user.id, [DOCUMENT_PREFIXES.memorandum])
  await sendAdminResetNotice(session, MEMORANDUM_RESET_NOTICE)

  let invoiceError: string | null = null
  if (withInvoice) {
    const result = await createAdminResetInvoice(
      session.user.id,
      ADMIN_RESET_CONFIG.memorandum.invoiceLine,
    )
    invoiceError = result.error
  }

  revalidatePath(VERKOOPPRESENTATIE_PATH)
  return { invoiceError }
}

export const resetAnonymousProfileByAdmin = async (
  withInvoice: boolean,
): Promise<ResetResult> => {
  const session = await requireImpersonation()

  await removeVaultDocsByPrefix(session.user.id, [
    DOCUMENT_PREFIXES.anonymousProfile,
  ])
  await sendAdminResetNotice(session, ANONIEM_RESET_NOTICE)

  let invoiceError: string | null = null
  if (withInvoice) {
    const result = await createAdminResetInvoice(
      session.user.id,
      ADMIN_RESET_CONFIG.anoniem.invoiceLine,
    )
    invoiceError = result.error
  }

  revalidatePath(VERKOOPPRESENTATIE_PATH)
  return { invoiceError }
}

// Ports requestDocumentRegeneration (osago-bundle.js:12293-12327): the €199
// heraanmaak request only fires the internal upsell notification — no document
// is regenerated. Wired here for the RegenerateRequestModal "Aanvragen" button.
export const requestDocumentRegeneration = async (
  documentType: RegenerateDocumentType,
): Promise<ActionResult> => {
  const session = await requireSession()
  const company = await getCompany(session.user.id)

  await sendTemplatedEmail(
    'upsell_interest_internal',
    INTERNAL_NOTIFICATION_EMAIL,
    {
      aanvraag_datum: resetDateStamp(),
      achternaam: session.lastName ?? '',
      bedrijfsnaam: company?.name ?? '',
      email: session.user.email ?? '',
      upsell_prijs: `${REGEN_DOC_FEE} eenmalig`,
      upsell_titel: REGEN_DOC_INFO[documentType].aanvraagTitel,
      voornaam: session.firstName ?? '',
    },
  )

  return { error: null }
}
