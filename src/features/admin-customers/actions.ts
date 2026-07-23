'use server'

import { revalidatePath } from 'next/cache'

import { legacyApiFetch } from '@shared/api/legacyApiFetch'
import { requireRole } from '@shared/auth/guards'
import { sendTemplatedEmail } from '@shared/email'
import { getServerClient } from '@shared/supabase/server'

import {
  ADMIN_KLANTEN_PATH,
  ADMIN_PROJECTEN_PATH,
  DOCS_BUCKET,
  DOWNLOAD_URL_TTL_SECONDS,
  SIGNUP_ENDPOINT,
} from './constants'
import { ensureCustomerIds } from './lib/customerIds'
import { getCustomerDetail, getCustomerOverview } from './queries'
import {
  AddBuyerSchema,
  CreateCustomerSchema,
  SignupResponseSchema,
  UploadDocumentSchema,
  type AddBuyerInput,
  type CreateCustomerInput,
  type UploadDocumentInput,
} from './schema'
import { type CustomerDetail, type CustomerOverview } from './types'

type ActionResult = { error: null } | { error: string }

// Read-through action so the (client) customer-detail modal can load on open
// without resetting the grid's search/filter state (legacy openCustomerDetail
// rebuilt an overlay in place).
export const loadCustomerDetail = async (
  userId: string,
): Promise<CustomerDetail | null> => {
  await requireRole('admin_user')
  return getCustomerDetail(userId)
}

// Read-through for the read-only "Bekijken" overview (openCustomerOverviewModal).
export const loadCustomerOverview = async (
  userId: string,
): Promise<CustomerOverview | null> => {
  await requireRole('admin_user')
  return getCustomerOverview(userId)
}

// Admin-scoped download (the shared createDocumentDownloadUrl is owner-scoped, so
// it can't serve a customer's doc to an admin). Ports downloadDocument's signed-
// URL branch under is_admin() RLS.
export const downloadCustomerDocument = async (
  docId: string,
): Promise<{ error: null; url: string } | { error: string; url: null }> => {
  await requireRole('admin_user')
  const supabase = await getServerClient()

  const { data: doc } = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', docId)
    .maybeSingle()

  if (!doc?.file_path) {
    return { error: 'Bestand niet beschikbaar.', url: null }
  }

  const { data, error } = await supabase.storage
    .from(DOCS_BUCKET)
    .createSignedUrl(doc.file_path, DOWNLOAD_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) {
    return { error: 'Download mislukt.', url: null }
  }

  return { error: null, url: data.signedUrl }
}

// Ports saveAdminCustomer (osago-bundle.js:24222) verbatim (D-C): the EXACT
// legacy call to the frozen /api/auth/signup with { email, password, firstName,
// lastName, phone } and NO recaptchaToken. The endpoint's server-side bot-check
// may reject it (it always requires a token) — that fails exactly as it does in
// legacy today; a token/endpoint fix is future work, not this slice's concern.
export const createCustomer = async (
  input: CreateCustomerInput,
): Promise<ActionResult> => {
  const parsed = CreateCustomerSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Controleer de gegevens.',
    }
  }

  await requireRole('admin_user')

  const result = await legacyApiFetch(SIGNUP_ENDPOINT, {
    body: JSON.stringify({
      email: parsed.data.email.toLowerCase(),
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      password: parsed.data.password,
      phone: parsed.data.phone,
    }),
    method: 'POST',
    schema: SignupResponseSchema,
  })

  if (result.error !== null || !result.data.ok || !result.data.userId) {
    return { error: result.data?.error ?? 'Aanmaken klant mislukt.' }
  }

  // Assign the new customer a K-code (and backfill any that lack one).
  const supabase = await getServerClient()
  await ensureCustomerIds(supabase)

  revalidatePath(ADMIN_KLANTEN_PATH)
  return { error: null }
}

export const assignAdvisor = async (
  userId: string,
  advisorId: string,
): Promise<ActionResult> => {
  await requireRole('admin_user')
  const supabase = await getServerClient()

  const { error } = await supabase
    .from('companies')
    .upsert(
      { assigned_advisor: advisorId || null, user_id: userId },
      { onConflict: 'user_id' },
    )

  if (error) {
    return { error: 'Adviseur toewijzen is mislukt.' }
  }

  if (advisorId) {
    const [{ data: customer }, { data: advisor }] = await Promise.all([
      supabase
        .from('profiles')
        .select('email, first_name')
        .eq('id', userId)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('email, first_name, last_name, phone')
        .eq('id', advisorId)
        .maybeSingle(),
    ])

    if (customer?.email) {
      await sendTemplatedEmail(
        'advisor_assigned',
        customer.email,
        {
          adviseur_email: advisor?.email ?? '',
          adviseur_naam:
            [advisor?.first_name, advisor?.last_name]
              .filter(Boolean)
              .join(' ') || 'Osago',
          adviseur_telefoon: advisor?.phone ?? '',
          voornaam: customer.first_name ?? '',
        },
        { related: { userId } },
      )
    }
  }

  revalidatePath(ADMIN_PROJECTEN_PATH)
  return { error: null }
}

const dataUrlToBuffer = (dataUrl: string): { buffer: Buffer; mime: string } => {
  const commaIndex = dataUrl.indexOf(',')
  const header = dataUrl.slice(0, commaIndex)
  const base64 = dataUrl.slice(commaIndex + 1)
  const mimeMatch = /:(.*?);/.exec(header)

  return {
    buffer: Buffer.from(base64, 'base64'),
    mime: mimeMatch ? mimeMatch[1] : 'application/octet-stream',
  }
}

// Admin uploads a document into a customer's dossier (osago-bundle.js:24654):
// source 'admin', Storage path <user_id>/<id>.<ext>, then a `document_added`
// email. Runs under is_admin() RLS (no impersonation needed) per D-A.
export const uploadDocumentForCustomer = async (
  input: UploadDocumentInput,
): Promise<ActionResult> => {
  const parsed = UploadDocumentSchema.safeParse(input)

  if (!parsed.success) {
    return { error: 'Ongeldig document.' }
  }

  await requireRole('admin_user')
  const supabase = await getServerClient()

  const docId = crypto.randomUUID()
  const ext = (parsed.data.fileName.split('.').pop() ?? 'bin')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  const path = `${parsed.data.userId}/${docId}.${ext || 'bin'}`
  const { buffer, mime } = dataUrlToBuffer(parsed.data.dataUrl)

  const { error: uploadError } = await supabase.storage
    .from(DOCS_BUCKET)
    .upload(path, buffer, { contentType: mime, upsert: true })

  if (uploadError) {
    return { error: 'Uploaden naar de opslag is mislukt.' }
  }

  const { error: insertError } = await supabase.from('documents').insert({
    description: parsed.data.description || null,
    file_name: parsed.data.fileName,
    file_path: path,
    file_size: parsed.data.fileSize,
    file_type: parsed.data.fileType,
    id: docId,
    source: 'admin',
    user_id: parsed.data.userId,
  })

  if (insertError) {
    return { error: 'Opslaan van het document is mislukt.' }
  }

  const { data: customer } = await supabase
    .from('profiles')
    .select('email, first_name')
    .eq('id', parsed.data.userId)
    .maybeSingle()

  if (customer?.email) {
    await sendTemplatedEmail(
      'document_added',
      customer.email,
      {
        document_naam: parsed.data.fileName,
        document_omschrijving: parsed.data.description || '',
        voornaam: customer.first_name ?? '',
      },
      { related: { userId: parsed.data.userId } },
    )
  }

  revalidatePath(ADMIN_PROJECTEN_PATH)
  return { error: null }
}

export const deleteCustomerDocument = async (
  docId: string,
): Promise<ActionResult> => {
  await requireRole('admin_user')
  const supabase = await getServerClient()

  const { data: doc } = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', docId)
    .maybeSingle()

  if (doc?.file_path) {
    await supabase.storage.from(DOCS_BUCKET).remove([doc.file_path])
  }

  const { error } = await supabase.from('documents').delete().eq('id', docId)

  if (error) {
    return { error: 'Verwijderen is mislukt.' }
  }

  revalidatePath(ADMIN_PROJECTEN_PATH)
  return { error: null }
}

// Admin "add buyer for customer" (osago-bundle.js:23064 isAdminAdd branch):
// writes an osago_validated-type lead into the target customer + an optional
// external-source follow-up email to the buyer when a source is set. Kept in
// admin-customers (not @features/leads) to decouple from the concurrently-built
// leads module — functionally identical to legacy's saveManualBuyer admin path.
export const addBuyerForCustomer = async (
  input: AddBuyerInput,
): Promise<ActionResult> => {
  const parsed = AddBuyerSchema.safeParse(input)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Ongeldige koper.' }
  }

  const session = await requireRole('admin_user')
  const supabase = await getServerClient()
  const data = parsed.data
  const contactName = [data.contactFirstName, data.contactLastName]
    .filter(Boolean)
    .join(' ')

  const { error } = await supabase.from('leads').insert({
    added_manually: false,
    contact_email: data.contactEmail || null,
    contact_first_name: data.contactFirstName || null,
    contact_last_name: data.contactLastName || null,
    contact_legacy: contactName || null,
    contact_phone: data.contactPhone || null,
    lead_type: 'osago_validated',
    name: data.name,
    source: data.source || null,
    stage: 'new',
    type: data.type || null,
    user_id: data.targetUserId,
    validated_at: new Date().toISOString(),
    validated_by: session.user.id,
    validated_by_osago: true,
  })

  if (error) {
    return { error: 'Toevoegen van de koper is mislukt.' }
  }

  if (data.source && data.contactEmail) {
    await sendTemplatedEmail(
      'lead_external_source_followup',
      data.contactEmail,
      {
        achternaam: data.contactLastName,
        lead_bedrijf: data.name,
        source: data.source,
        voornaam: data.contactFirstName,
      },
      { related: { userId: data.targetUserId } },
    )
  }

  revalidatePath(ADMIN_PROJECTEN_PATH)
  return { error: null }
}
