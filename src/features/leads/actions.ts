'use server'

import { revalidatePath } from 'next/cache'

import { getCompany } from '@features/company/queries'
import { logSelfGeneratedDocument } from '@features/documents'
import { type ApiResult } from '@shared/api/fetcher'
import { legacyApiFetch } from '@shared/api/legacyApiFetch'
import { requireSession } from '@shared/auth/session'
import { getServerClient } from '@shared/supabase/server'

import {
  AUTO_LEAD_FIT_DEFAULT,
  IDENTIFIED_BUYER_DEFAULT_TYPE,
  MANUAL_LEAD_FIT_DEFAULT,
} from './constants/leadTypes'
import { KOPERMATCHING_PATH, VERKOOPPROCES_PATH } from './constants/routes'
import { SALES_DOCUMENT_FILE_TYPE } from './constants/salesDocuments'
import {
  LEAD_VALIDATION_ENDPOINT,
  MANUAL_LEAD_VALIDATION_FEE,
} from './constants/validation'
import { buildIdentifyRequest } from './lib/buildIdentifyRequest'
import { buildContractHtml } from './lib/salesDocuments/buildContractHtml'
import { buildLoiHtml } from './lib/salesDocuments/buildLoiHtml'
import { buildNdaHtml } from './lib/salesDocuments/buildNdaHtml'
import { safeFileName } from './lib/salesDocuments/shared'
import { getLeadById } from './queries'
import {
  IdentifyErrorSchema,
  IdentifyResponseSchema,
  LeadStageSchema,
  LeadValidationPaymentSchema,
} from './schema'
import {
  type Lead,
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
  const supabase = await getServerClient()

  const { error } = await supabase
    .from('leads')
    .update({ stage: parsedStage.data })
    .eq('user_id', session.user.id)
    .eq('id', id)
    .eq('lead_type', 'pipeline')

  if (error) {
    return { error: 'Verplaatsen van de koper is mislukt.' }
  }

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
