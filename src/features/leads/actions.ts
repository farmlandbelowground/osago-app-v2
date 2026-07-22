'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { getCompany } from '@features/company/queries'
import {
  logSelfGeneratedDocument,
  DOCUMENT_PREFIXES,
} from '@features/documents'
import { DOCS_BUCKET } from '@features/documents/constants/storage'
import { type ApiResult } from '@shared/api/fetcher'
import { legacyApiFetch } from '@shared/api/legacyApiFetch'
import { requireImpersonation, requireRole } from '@shared/auth/guards'
import { requireSession, type AuthSession } from '@shared/auth/session'
import { sendTemplatedEmail } from '@shared/email'
import { getServerClient } from '@shared/supabase/server'

import {
  AUTO_LEAD_FIT_DEFAULT,
  IDENTIFIED_BUYER_DEFAULT_TYPE,
  MANUAL_LEAD_FIT_DEFAULT,
} from './constants/leadTypes'
import {
  ADMIN_PROJECTEN_PATH,
  KOPERMATCHING_PATH,
  VERKOOPPROCES_PATH,
} from './constants/routes'
import { SALES_DOCUMENT_FILE_TYPE } from './constants/salesDocuments'
import { UPSELL_NONE_LINE, UPSELL_OPTIONS } from './constants/upsell'
import {
  LEAD_VALIDATION_ENDPOINT,
  MANUAL_LEAD_VALIDATION_FEE,
} from './constants/validation'
import { buildIdentifyRequest } from './lib/buildIdentifyRequest'
import { buyerDisplayName } from './lib/buyerDisplayName'
import { buildContractHtml } from './lib/salesDocuments/buildContractHtml'
import { buildLoiHtml } from './lib/salesDocuments/buildLoiHtml'
import { buildNdaHtml } from './lib/salesDocuments/buildNdaHtml'
import { safeFileName } from './lib/salesDocuments/shared'
import { stageLabel } from './lib/stageMapping'
import { getLeadById } from './queries'
import {
  IdentifyErrorSchema,
  IdentifyResponseSchema,
  LeadStageSchema,
  LeadValidationPaymentSchema,
} from './schema'
import {
  type Lead,
  type LeadStage,
  type ManualLeadInput,
  type ManualPromoteMode,
  type PipelineLeadInput,
  type SalesDocumentKind,
} from './types'

type ActionResult = { error: null } | { error: string }
type ManualPromoteResult =
  { error: null; redirectUrl: string | null } | { error: string }

const nowIso = (): string => new Date().toISOString()

const joinName = (first: string, last: string): string =>
  [first, last].filter(Boolean).join(' ')

const joinLocation = (city: string, country: string): string =>
  [city, country].filter(Boolean).join(', ')

// Fires the transactional pipeline emails after a stage change (best-effort —
// never blocks/fails the move). Ports triggerDealAfwikkelenEmail
// (osago-bundle.js:23516) + sendPipelineStageChangedEmail (:12245): a move INTO
// 'closing' fires the deal-afwikkelen mail AND the stage-changed mail; any other
// change fires only the stage-changed mail, skipped when moving into 'new' /
// 'no_interest'. Recipient is the seller (the pipeline owner).
const fireStageChangeEmails = async (
  session: AuthSession,
  companyName: string,
  lead: Lead,
  oldStage: LeadStage | null,
  newStage: LeadStage,
): Promise<void> => {
  const to = session.user.email
  if (!to || oldStage === newStage) {
    return
  }

  const related = { leadId: lead.id, userId: session.user.id }
  const voornaam = session.firstName ?? ''
  const achternaam = session.lastName ?? ''

  if (oldStage !== 'closing' && newStage === 'closing') {
    await sendTemplatedEmail(
      'pipeline_deal_afwikkelen',
      to,
      {
        achternaam,
        eigen_bedrijf: companyName,
        koper_naam: lead.name || 'deze koper',
        voornaam,
      },
      { related },
    )
  }

  if (newStage !== 'new' && newStage !== 'no_interest') {
    const matching = UPSELL_OPTIONS.filter(option =>
      option.stages.includes(newStage),
    )
    const upgradesLijst =
      matching.length > 0
        ? matching
            .map(
              option =>
                `    • ${option.title} — ${option.price} ${option.unit}`,
            )
            .join('\n')
        : UPSELL_NONE_LINE

    await sendTemplatedEmail(
      'pipeline_stage_changed',
      to,
      {
        achternaam,
        koper_naam: buyerDisplayName(lead),
        nieuwe_fase: stageLabel(newStage),
        oude_fase: stageLabel(oldStage),
        upgrades_lijst: upgradesLijst,
        voornaam,
      },
      { related },
    )
  }
}

// Field bag shared by candidate→pipeline copies — mirrors legacy's `{...lead}`
// spread that carries every contact/address field onto the pipeline row.
const copyLeadFields = (lead: Lead): Record<string, unknown> => ({
  city: lead.city,
  contact_email: lead.contactEmail,
  contact_first_name: lead.contactFirstName,
  contact_last_name: lead.contactLastName,
  contact_legacy: lead.contactLegacy,
  contact_phone: lead.contactPhone,
  country: lead.country,
  fit_score: lead.fitScore,
  house_number: lead.houseNumber,
  house_number_addition: lead.houseNumberAddition,
  location: lead.location,
  name: lead.name,
  notes: lead.notes,
  postal_code: lead.postalCode,
  street: lead.street,
  type: lead.type,
  website: lead.website,
})

export const identifyBuyers = async (): Promise<
  ApiResult<{ count: number; note?: string }>
> => {
  const session = await requireSession()
  const userId = session.user.id

  const company = await getCompany(userId)
  if (!company?.sector) {
    return { data: null, error: 'Vul eerst je sector in bij Mijn bedrijf.' }
  }

  const result = await legacyApiFetch('/api/leads/identify', {
    body: JSON.stringify(buildIdentifyRequest(company)),
    errorSchema: IdentifyErrorSchema,
    method: 'POST',
    schema: IdentifyResponseSchema,
  })

  if (result.error !== null) {
    console.error('[identifyBuyers] /api/leads/identify failed:', result.error)
    // Surface the endpoint's own message when it gave one (parity with legacy's
    // `data.error` toast); fall back to the generic text for opaque failures
    // (network/404/unparseable body).
    const isOpaque =
      result.error.startsWith('Request failed:') ||
      result.error === 'Invalid response shape'
    return {
      data: null,
      error: isOpaque
        ? 'Automatische identificatie mislukt. Probeer het later opnieuw.'
        : result.error,
    }
  }

  const supabase = await getServerClient()

  // Preserve promotion state by lowercased name across a re-run (osago-bundle.js:21191-21192).
  const { data: existing } = await supabase
    .from('leads')
    .select('name, promoted_to_pipeline')
    .eq('user_id', userId)
    .eq('lead_type', 'auto_identified')

  const promotedNames = new Set(
    (existing ?? [])
      .filter(row => row.promoted_to_pipeline)
      .map(row => (row.name ?? '').toLowerCase()),
  )

  // Legacy OVERWRITES the whole auto set on each run (OQ-9, osago-bundle.js:21209).
  await supabase
    .from('leads')
    .delete()
    .eq('user_id', userId)
    .eq('lead_type', 'auto_identified')

  const rows = result.data.leads.map(buyer => ({
    added_manually: false,
    fit_score:
      typeof buyer.fitScore === 'number'
        ? buyer.fitScore
        : AUTO_LEAD_FIT_DEFAULT,
    lead_type: 'auto_identified' as const,
    location: buyer.location || null,
    name: buyer.name || null,
    notes: buyer.rationale || null,
    promoted_to_pipeline: promotedNames.has((buyer.name || '').toLowerCase()),
    source: 'auto',
    stage: 'new' as const,
    type: buyer.type || IDENTIFIED_BUYER_DEFAULT_TYPE,
    user_id: userId,
    website: buyer.website || null,
  }))

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from('leads').insert(rows)
    if (insertError) {
      return { data: null, error: 'Opslaan van de gevonden kopers is mislukt.' }
    }
  }

  revalidatePath(KOPERMATCHING_PATH)
  return {
    data: { count: result.data.leads.length, note: result.data.note },
    error: null,
  }
}

export const addManualLead = async (
  input: ManualLeadInput,
): Promise<ActionResult> => {
  const session = await requireSession()

  const name = input.name.trim()
  const first = input.contactFirstName.trim()
  const last = input.contactLastName.trim()

  if (!name && !(first && last)) {
    return {
      error:
        'Vul een bedrijfsnaam in, of een voor- en achternaam van de contactpersoon.',
    }
  }

  const supabase = await getServerClient()
  const city = input.city.trim()
  const country = input.country.trim()

  const { error } = await supabase.from('leads').insert({
    added_manually: true,
    city: city || null,
    contact_email: input.contactEmail.trim() || null,
    contact_first_name: first || null,
    contact_last_name: last || null,
    contact_legacy: joinName(first, last) || null,
    contact_phone: input.contactPhone.trim() || null,
    country: country || null,
    fit_score: MANUAL_LEAD_FIT_DEFAULT,
    house_number: input.houseNumber.trim() || null,
    house_number_addition: input.houseNumberAddition.trim() || null,
    lead_type: 'manual',
    location: joinLocation(city, country) || null,
    name: name || null,
    notes: input.notes.trim() || null,
    postal_code: input.postalCode.trim() || null,
    stage: 'new',
    street: input.street.trim() || null,
    type: input.type,
    user_id: session.user.id,
  })

  if (error) {
    return { error: 'Toevoegen van de lead is mislukt.' }
  }

  revalidatePath(KOPERMATCHING_PATH)
  return { error: null }
}

export const initiateLeadValidationPayment = async (
  id: string,
): Promise<ApiResult<{ checkoutUrl: string }>> => {
  const session = await requireSession()
  const lead = await getLeadById(session.user.id, id)

  if (!lead) {
    return { data: null, error: 'Lead niet gevonden.' }
  }

  const result = await legacyApiFetch(LEAD_VALIDATION_ENDPOINT, {
    body: JSON.stringify({
      fee: MANUAL_LEAD_VALIDATION_FEE,
      leadId: id,
      mode: 'lead_validation',
    }),
    method: 'POST',
    schema: LeadValidationPaymentSchema,
  })

  if (result.error !== null) {
    return { data: null, error: 'Aanmaken van de factuur mislukt.' }
  }

  return { data: { checkoutUrl: result.data.paymentUrl }, error: null }
}

const insertPipelineCopy = async (
  userId: string,
  lead: Lead,
  extra: Record<string, unknown>,
): Promise<boolean> => {
  const supabase = await getServerClient()
  const { error } = await supabase.from('leads').insert({
    ...copyLeadFields(lead),
    lead_type: 'pipeline',
    stage: 'new',
    user_id: userId,
    ...extra,
  })
  return !error
}

const markCandidatePromoted = async (
  userId: string,
  id: string,
): Promise<void> => {
  const supabase = await getServerClient()
  await supabase
    .from('leads')
    .update({ promoted_at: nowIso(), promoted_to_pipeline: true })
    .eq('user_id', userId)
    .eq('id', id)
}

export const promoteManualLead = async (
  id: string,
  mode: ManualPromoteMode,
): Promise<ManualPromoteResult> => {
  const session = await requireSession()
  const userId = session.user.id

  const lead = await getLeadById(userId, id)
  if (!lead || lead.leadType !== 'manual') {
    return { error: 'Lead niet gevonden.' }
  }
  if (lead.promotedToPipeline) {
    return { error: 'Deze lead staat al in jouw pipeline.' }
  }
  if (lead.validationStatus === 'pending_validation') {
    return {
      error: 'Voor deze lead loopt al een validatie-aanvraag bij Osago.',
    }
  }

  if (mode === 'validation') {
    const payment = await initiateLeadValidationPayment(id)
    if (payment.error !== null) {
      return { error: payment.error }
    }
    return { error: null, redirectUrl: payment.data.checkoutUrl }
  }

  const inserted = await insertPipelineCopy(userId, lead, {
    promoted_from_manual_at: nowIso(),
  })
  if (!inserted) {
    return { error: 'Toevoegen aan de pipeline is mislukt.' }
  }

  await markCandidatePromoted(userId, id)

  revalidatePath(KOPERMATCHING_PATH)
  revalidatePath(VERKOOPPROCES_PATH)
  return { error: null, redirectUrl: null }
}

export const promoteOsagoLead = async (id: string): Promise<ActionResult> => {
  const session = await requireSession()
  const userId = session.user.id

  const lead = await getLeadById(userId, id)
  if (!lead || lead.leadType !== 'osago_validated') {
    return { error: 'Lead niet gevonden.' }
  }
  if (lead.promotedToPipeline) {
    return { error: 'Deze lead staat al in jouw pipeline.' }
  }

  const inserted = await insertPipelineCopy(userId, lead, {
    promoted_from_osago_lead_at: nowIso(),
    validated_at: lead.validatedAt,
    validated_by: lead.validatedBy,
    validated_by_osago: lead.validatedByOsago,
  })
  if (!inserted) {
    return { error: 'Toevoegen aan de pipeline is mislukt.' }
  }

  await markCandidatePromoted(userId, id)

  revalidatePath(KOPERMATCHING_PATH)
  revalidatePath(VERKOOPPROCES_PATH)
  return { error: null }
}

// Two-hop: copy an auto lead into the manual-candidate list (NOT straight to the
// pipeline), dedup by name (osago-bundle.js:21231-21261).
export const promoteAutoLead = async (id: string): Promise<ActionResult> => {
  const session = await requireSession()
  const userId = session.user.id

  const lead = await getLeadById(userId, id)
  if (!lead || lead.leadType !== 'auto_identified') {
    return { error: 'Lead niet gevonden.' }
  }
  if (lead.promotedToPipeline) {
    return { error: 'Deze lead is al toegevoegd aan jouw leads.' }
  }

  const supabase = await getServerClient()

  const { data: existingManual } = await supabase
    .from('leads')
    .select('name')
    .eq('user_id', userId)
    .eq('lead_type', 'manual')

  const isDuplicate =
    !!lead.name &&
    (existingManual ?? []).some(
      row => (row.name ?? '').toLowerCase() === (lead.name ?? '').toLowerCase(),
    )

  if (!isDuplicate) {
    const { error: insertError } = await supabase.from('leads').insert({
      added_manually: true,
      fit_score: lead.fitScore ?? AUTO_LEAD_FIT_DEFAULT,
      lead_type: 'manual',
      location: lead.location,
      name: lead.name,
      notes: lead.notes
        ? `Automatisch geïdentificeerd. ${lead.notes}`
        : 'Automatisch geïdentificeerde koper.',
      stage: 'new',
      type: lead.type,
      user_id: userId,
      website: lead.website,
    })
    if (insertError) {
      return { error: 'Toevoegen aan jouw leads is mislukt.' }
    }
  }

  await supabase
    .from('leads')
    .update({ promoted_to_pipeline: true })
    .eq('user_id', userId)
    .eq('id', id)

  revalidatePath(KOPERMATCHING_PATH)
  return { error: null }
}

export const updatePipelineLead = async (
  id: string,
  input: PipelineLeadInput,
): Promise<ActionResult> => {
  const parsedStage = LeadStageSchema.safeParse(input.stage)
  if (!parsedStage.success) {
    return { error: 'Ongeldige fase.' }
  }

  const session = await requireSession()
  const userId = session.user.id

  const lead = await getLeadById(userId, id)
  if (!lead || lead.leadType !== 'pipeline') {
    return { error: 'Koper niet gevonden.' }
  }

  const first = input.contactFirstName.trim()
  const last = input.contactLastName.trim()
  const city = input.city.trim()
  const country = input.country.trim()

  const supabase = await getServerClient()
  const { error } = await supabase
    .from('leads')
    .update({
      city: city || null,
      contact_email: input.contactEmail.trim() || null,
      contact_first_name: first || null,
      contact_last_name: last || null,
      contact_legacy: joinName(first, last) || null,
      contact_phone: input.contactPhone.trim() || null,
      country: country || null,
      fit_score: input.fitScore,
      house_number: input.houseNumber.trim() || null,
      house_number_addition: input.houseNumberAddition.trim() || null,
      location: joinLocation(city, country) || null,
      notes: input.notes.trim() || null,
      postal_code: input.postalCode.trim() || null,
      stage: parsedStage.data,
      street: input.street.trim() || null,
    })
    .eq('user_id', userId)
    .eq('id', id)

  if (error) {
    return { error: 'Opslaan van de wijzigingen is mislukt.' }
  }

  const company = await getCompany(userId)
  await fireStageChangeEmails(
    session,
    company?.name ?? '',
    lead,
    lead.stage,
    parsedStage.data,
  )

  revalidatePath(VERKOOPPROCES_PATH)
  return { error: null }
}

export const moveLeadStage = async (
  id: string,
  stage: string,
): Promise<ActionResult> => {
  const parsedStage = LeadStageSchema.safeParse(stage)
  if (!parsedStage.success) {
    return { error: 'Ongeldige fase.' }
  }

  const session = await requireSession()
  const userId = session.user.id

  const lead = await getLeadById(userId, id)
  if (!lead || lead.leadType !== 'pipeline') {
    return { error: 'Koper niet gevonden.' }
  }

  const supabase = await getServerClient()

  const { error } = await supabase
    .from('leads')
    .update({ stage: parsedStage.data })
    .eq('user_id', userId)
    .eq('id', id)
    .eq('lead_type', 'pipeline')

  if (error) {
    return { error: 'Verplaatsen van de koper is mislukt.' }
  }

  const company = await getCompany(userId)
  await fireStageChangeEmails(
    session,
    company?.name ?? '',
    lead,
    lead.stage,
    parsedStage.data,
  )

  revalidatePath(VERKOOPPROCES_PATH)
  return { error: null }
}

export const deleteLead = async (id: string): Promise<ActionResult> => {
  const session = await requireSession()
  const supabase = await getServerClient()

  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('user_id', session.user.id)
    .eq('id', id)

  if (error) {
    return { error: 'Verwijderen is mislukt.' }
  }

  revalidatePath(KOPERMATCHING_PATH)
  revalidatePath(VERKOOPPROCES_PATH)
  return { error: null }
}

interface SalesDocumentMeta {
  description: string
  fileName: string
  html: string
}

const buildSalesDocument = (
  kind: SalesDocumentKind,
  context: Parameters<typeof buildNdaHtml>[0],
  sellerName: string,
  buyerName: string,
): SalesDocumentMeta => {
  const namePart = `${safeFileName(sellerName)}_${safeFileName(buyerName)}`

  if (kind === 'loi') {
    return {
      description: `Intentieverklaring (LOI) voor ${buyerName}`,
      fileName: `LOI_${namePart}.doc`,
      html: buildLoiHtml(context),
    }
  }
  if (kind === 'contract') {
    return {
      description: `Verkoopcontract voor ${buyerName}`,
      fileName: `Verkoopcontract_${namePart}.doc`,
      html: buildContractHtml(context),
    }
  }
  return {
    description: `NDA voor ${buyerName}`,
    fileName: `NDA_${namePart}.doc`,
    html: buildNdaHtml(context),
  }
}

export const generateSalesDocument = async (
  leadId: string,
  kind: SalesDocumentKind,
): Promise<ApiResult<{ fileName: string }>> => {
  const session = await requireSession()
  const userId = session.user.id

  const [lead, company] = await Promise.all([
    getLeadById(userId, leadId),
    getCompany(userId),
  ])

  if (!lead) {
    return { data: null, error: 'Koper niet gevonden.' }
  }
  if (!company?.name) {
    return {
      data: null,
      error: 'Vul eerst jouw bedrijfsnaam in onder Mijn bedrijf.',
    }
  }

  const today = new Date().toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const context = {
    buyer: lead,
    company: {
      city: company.city,
      kvkNummer: company.kvkNummer,
      name: company.name,
    },
    seller: {
      email: session.user.email ?? '',
      signatory: joinName(session.firstName ?? '', session.lastName ?? ''),
    },
    today,
  }

  const buyerName = lead.name || '[bedrijfsnaam koper]'
  const document = buildSalesDocument(kind, context, company.name, buyerName)

  const fileBase64 = Buffer.from(`﻿${document.html}`, 'utf-8').toString(
    'base64',
  )

  const result = await logSelfGeneratedDocument({
    description: document.description,
    fileBase64,
    fileName: document.fileName,
    fileType: SALES_DOCUMENT_FILE_TYPE,
  })

  if (result.error !== null) {
    return { data: null, error: result.error }
  }

  return { data: { fileName: document.fileName }, error: null }
}

// ─────────────────────────────────────────────────────────────────────────
// Slice 13 Part C — admin lead tools (admin app, is_admin RLS) + impersonation-
// gated seller communications.
// ─────────────────────────────────────────────────────────────────────────

const ApproveValidationSchema = z.object({
  leadId: z.string().min(1),
  userId: z.string().min(1),
})

// Admin (NOT impersonation): mark a paid manual lead validated + promote a
// pipeline copy + notify the seller. D-M: validated_by stores the admin UUID
// (column is uuid); the {{gevalideerd_door}} email var carries the admin's
// display name resolved from the session.
export const approveLeadValidation = async (
  userId: string,
  leadId: string,
): Promise<ActionResult> => {
  const parsed = ApproveValidationSchema.safeParse({ leadId, userId })
  if (!parsed.success) {
    return { error: 'Ongeldige invoer.' }
  }

  const session = await requireRole('admin_user')
  const lead = await getLeadById(userId, leadId)

  if (!lead || lead.leadType !== 'manual') {
    return { error: 'Lead niet gevonden.' }
  }
  if (lead.validationStatus !== 'pending_validation') {
    return { error: 'Deze lead heeft geen openstaande validatie-aanvraag.' }
  }

  const now = nowIso()
  const adminUuid = session.user.id
  const adminName =
    [session.firstName, session.lastName].filter(Boolean).join(' ') || 'Osago'

  const supabase = await getServerClient()
  const { error: updateError } = await supabase
    .from('leads')
    .update({
      promoted_at: now,
      promoted_to_pipeline: true,
      validated_at: now,
      validated_by: adminUuid,
      validated_by_osago: true,
      validation_status: 'validated',
    })
    .eq('user_id', userId)
    .eq('id', leadId)

  if (updateError) {
    return { error: 'Valideren is mislukt. Probeer het opnieuw.' }
  }

  await insertPipelineCopy(userId, lead, {
    promoted_from_manual_at: now,
    validated_at: now,
    validated_by: adminUuid,
    validated_by_osago: true,
  })

  const { data: customer } = await supabase
    .from('profiles')
    .select('email, first_name')
    .eq('id', userId)
    .maybeSingle()

  if (customer?.email) {
    await sendTemplatedEmail(
      'lead_validated',
      customer.email,
      {
        gevalideerd_door: adminName,
        lead_naam: buyerDisplayName(lead),
        voornaam: customer.first_name ?? '',
      },
      { related: { leadId, userId } },
    )
  }

  revalidatePath(ADMIN_PROJECTEN_PATH)
  revalidatePath(KOPERMATCHING_PATH)
  revalidatePath(VERKOOPPROCES_PATH)
  return { error: null }
}

// Reads the impersonated customer's anonymous-profile document from Storage and
// returns it base64-encoded for the teaser attachment (D-L). Server-side only.
const fetchAnonProfileAttachment = async (
  userId: string,
): Promise<{ content: string; fileName: string } | null> => {
  const supabase = await getServerClient()
  const { data: docs } = await supabase
    .from('documents')
    .select('file_name, file_path')
    .eq('user_id', userId)
    .eq('source', 'self-generated')

  const doc = (docs ?? []).find(
    row =>
      typeof row.file_name === 'string' &&
      row.file_name.startsWith(DOCUMENT_PREFIXES.anonymousProfile),
  )

  if (!doc?.file_path) {
    return null
  }

  const { data: blob, error } = await supabase.storage
    .from(DOCS_BUCKET)
    .download(doc.file_path)

  if (error || !blob) {
    return null
  }

  const buffer = Buffer.from(await blob.arrayBuffer())
  return { content: buffer.toString('base64'), fileName: doc.file_name }
}

const nlTimestamp = (): string =>
  new Date().toLocaleString('nl-NL', {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  })

// Impersonation-gated: send the anonymous teaser (with the anon-profile PDF
// attached) to the buyer contact. NOTE: the frozen /api/email/send-template
// renders subject/body server-side from the stored template + vars, so the
// legacy modal's editable subject/body cannot be transmitted — v2 passes the
// template vars instead (documented deviation). Audit note prepended to notes.
export const sendTeaser = async (leadId: string): Promise<ActionResult> => {
  const session = await requireImpersonation()
  const userId = session.user.id
  const lead = await getLeadById(userId, leadId)

  if (!lead) {
    return { error: 'Koper niet gevonden.' }
  }
  if (!lead.contactEmail) {
    return { error: 'Deze koper heeft geen e-mailadres.' }
  }

  const attachment = await fetchAnonProfileAttachment(userId)
  if (!attachment) {
    return { error: 'Teaser niet gevonden in Documentenkluis.' }
  }

  const supabase = await getServerClient()
  const [company, adviseur] = await Promise.all([
    getCompany(userId),
    supabase
      .from('profiles')
      .select('first_name, last_name, email, phone')
      .eq('id', session.impersonatedBy ?? '')
      .maybeSingle(),
  ])

  const adviseurRow = adviseur.data
  const adviseurNaam =
    [adviseurRow?.first_name, adviseurRow?.last_name]
      .filter(Boolean)
      .join(' ') || 'Osago'

  await sendTemplatedEmail(
    'teaser_to_buyer',
    lead.contactEmail,
    {
      adviseur_email: adviseurRow?.email ?? 'support@osago.nl',
      adviseur_naam: adviseurNaam,
      adviseur_telefoon: adviseurRow?.phone ?? '085 029 2894',
      contactpersoon:
        [lead.contactFirstName, lead.contactLastName]
          .filter(Boolean)
          .join(' ') ||
        (lead.name ?? ''),
      indicatieve_omzet: '—',
      koper_bedrijf: lead.name ?? '',
      locatie: company?.city ?? '—',
      sector: company?.sector ?? '—',
    },
    {
      attachments: [
        { content: attachment.content, fileName: attachment.fileName },
      ],
      related: { leadId, userId },
    },
  )

  const noteLine = `[${nlTimestamp()}] Teaser verstuurd door ${adviseurNaam} naar ${lead.contactEmail}.`
  await supabase
    .from('leads')
    .update({ notes: lead.notes ? `${noteLine}\n${lead.notes}` : noteLine })
    .eq('user_id', userId)
    .eq('id', leadId)

  revalidatePath(VERKOOPPROCES_PATH)
  return { error: null }
}

const ValidationUpdateSchema = z.object({
  leadId: z.string().min(1),
  updateText: z
    .string()
    .trim()
    .min(1, 'Schrijf eerst een update voor de klant.'),
})

// Impersonation-gated: send a free-text validation update to the seller.
export const sendValidationUpdate = async (
  leadId: string,
  updateText: string,
): Promise<ActionResult> => {
  const parsed = ValidationUpdateSchema.safeParse({ leadId, updateText })
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        'Schrijf eerst een update voor de klant.',
    }
  }

  const session = await requireImpersonation()
  const userId = session.user.id
  const lead = await getLeadById(userId, leadId)

  if (!lead) {
    return { error: 'Koper niet gevonden.' }
  }

  const to = session.user.email
  if (!to) {
    return { error: 'Klant heeft geen e-mailadres.' }
  }

  const supabase = await getServerClient()
  const [company, adviseur] = await Promise.all([
    getCompany(userId),
    supabase
      .from('profiles')
      .select('first_name, last_name, email, phone')
      .eq('id', session.impersonatedBy ?? '')
      .maybeSingle(),
  ])

  const adviseurRow = adviseur.data
  const adviseurNaam =
    [adviseurRow?.first_name, adviseurRow?.last_name]
      .filter(Boolean)
      .join(' ') || 'Osago'
  const koperType = (lead.type ?? '').trim()

  await sendTemplatedEmail(
    'lead_validation_update_to_customer',
    to,
    {
      achternaam: session.lastName ?? '',
      adviseur_email: adviseurRow?.email ?? 'support@osago.nl',
      adviseur_naam: adviseurNaam,
      adviseur_telefoon: adviseurRow?.phone ?? '085 029 2894',
      bedrijfsnaam: company?.name ?? '',
      koper_locatie: lead.location ?? lead.city ?? '—',
      koper_naam: lead.name ?? 'deze koper',
      koper_sector: '—',
      koper_type: koperType,
      koper_type_inline: koperType ? ` (${koperType})` : '',
      update_tekst: parsed.data.updateText,
      voornaam: session.firstName ?? '',
    },
    { related: { leadId, userId } },
  )

  const noteLine = `[${nlTimestamp()}] Validatie-update verstuurd door ${adviseurNaam} naar ${to}.`
  await supabase
    .from('leads')
    .update({ notes: lead.notes ? `${noteLine}\n${lead.notes}` : noteLine })
    .eq('user_id', userId)
    .eq('id', leadId)

  revalidatePath(VERKOOPPROCES_PATH)
  return { error: null }
}
