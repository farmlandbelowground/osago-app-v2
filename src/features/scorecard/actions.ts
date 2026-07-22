'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { DOCUMENT_PREFIXES } from '@features/documents'
import { DOCS_BUCKET } from '@features/documents/constants/storage'
import {
  ADMIN_RESET_CONFIG,
  createAdminResetInvoice,
} from '@shared/admin-reset'
import { requireImpersonation } from '@shared/auth/guards'
import { sendTemplatedEmail } from '@shared/email'
import { getServerClient } from '@shared/supabase/server'

import { VERKOOPKLAAR_MAKEN_PATH } from './constants/routes'
import {
  CompanyScorecardExtraSchema,
  ScorecardAnswerIdSchema,
  type ScorecardAnswerState,
} from './schema'

type ActionResult = { error: null } | { error: string }

const SaveAnswerSchema = z.object({
  answer: ScorecardAnswerIdSchema.nullable(),
  questionId: z.string().min(1),
})

const nlDate = (): string =>
  new Date().toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

// Per-answer read-modify-write of companies.extra.scorecard, preserving every
// other extra key and the answer's own `notes` (osago-bundle.js:7549-7597). A
// null answer clears the answer (N.v.t. unchecked) while keeping notes. No
// revalidatePath — the workspace holds authoritative optimistic state for the
// session; a server refetch would clobber it.
export const saveScorecardAnswer = async (
  questionId: string,
  answer: string | null,
): Promise<ActionResult> => {
  const parsed = SaveAnswerSchema.safeParse({ answer, questionId })

  if (!parsed.success) {
    return { error: 'Ongeldige invoer.' }
  }

  const session = await requireImpersonation()
  const supabase = await getServerClient()

  const { data } = await supabase
    .from('companies')
    .select('extra')
    .eq('user_id', session.user.id)
    .maybeSingle()

  const extraParsed = CompanyScorecardExtraSchema.safeParse(data?.extra)
  const extra = extraParsed.success ? extraParsed.data : {}
  const scorecard = { ...(extra.scorecard ?? {}) }
  const existing: ScorecardAnswerState = scorecard[parsed.data.questionId] ?? {}

  if (parsed.data.answer === null) {
    const { answer: _cleared, ...rest } = existing
    scorecard[parsed.data.questionId] = rest
  } else {
    scorecard[parsed.data.questionId] = {
      ...existing,
      answer: parsed.data.answer,
    }
  }

  const { error } = await supabase.from('companies').upsert(
    { extra: { ...extra, scorecard }, user_id: session.user.id },
    { onConflict: 'user_id' },
  )

  if (error) {
    return { error: 'Opslaan is mislukt. Probeer het opnieuw.' }
  }

  return { error: null }
}

// €199 regenerate is request-only (osago-bundle.js:12293): it emails the
// internal upsell notice and does NOT regenerate anything. Fire-and-forget —
// always reports success so the confirmation modal shows regardless.
export const requestReportRegeneration = async (): Promise<ActionResult> => {
  const session = await requireImpersonation()
  const supabase = await getServerClient()

  const [{ data: profile }, { data: company }] = await Promise.all([
    supabase
      .from('profiles')
      .select('first_name, last_name, email, phone, company')
      .eq('id', session.user.id)
      .maybeSingle(),
    supabase
      .from('companies')
      .select('name')
      .eq('user_id', session.user.id)
      .maybeSingle(),
  ])

  await sendTemplatedEmail(
    'upsell_interest_internal',
    'support@osago.nl',
    {
      aanvraag_datum: nlDate(),
      achternaam: profile?.last_name ?? '',
      bedrijfsnaam: company?.name ?? profile?.company ?? '',
      email: profile?.email ?? '',
      telefoonnummer: profile?.phone ?? '',
      upsell_prijs: '€ 199,- eenmalig',
      upsell_titel: 'Heraanmaak verbeterrapport (Verkoopklaar maken)',
      voornaam: profile?.first_name ?? '',
    },
    { related: { userId: session.user.id } },
  )

  return { error: null }
}

// Medewerker reset (osago-bundle.js:12563-12652 via ADMIN_RESET_CONFIG
// .verbeterrapport): remove the vault report + admin_reset_notice email +
// optional €199 invoice. Returns invoiceError only (the reset itself always
// stands, exactly as performAdminReset).
export const resetImprovementReportByAdmin = async (
  withInvoice: boolean,
): Promise<{ invoiceError: string | null }> => {
  const session = await requireImpersonation()
  const supabase = await getServerClient()

  const { data: docs } = await supabase
    .from('documents')
    .select('id, file_name, file_path')
    .eq('user_id', session.user.id)

  const toRemove = (docs ?? []).filter(
    doc =>
      typeof doc.file_name === 'string' &&
      doc.file_name.startsWith(DOCUMENT_PREFIXES.improvementReport),
  )

  if (toRemove.length > 0) {
    const paths = toRemove
      .map(doc => doc.file_path)
      .filter((path): path is string => Boolean(path))

    if (paths.length > 0) {
      await supabase.storage.from(DOCS_BUCKET).remove(paths)
    }
    await supabase
      .from('documents')
      .delete()
      .in(
        'id',
        toRemove.map(doc => doc.id),
      )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, email')
    .eq('id', session.user.id)
    .maybeSingle()

  if (profile?.email) {
    await sendTemplatedEmail(
      'admin_reset_notice',
      profile.email,
      {
        achternaam: profile.last_name ?? '',
        onderdeel: 'Verbeterrapport (Verkoopklaar maken)',
        onderdeel_lc: 'het verbeterrapport',
        reset_datum: nlDate(),
        toelichting:
          'Het verbeterrapport is uit jouw Documentenkluis verwijderd. Op de Verkoopklaar maken-pagina kun je een nieuwe versie genereren.',
        voornaam: profile.first_name ?? '',
      },
      { related: { userId: session.user.id } },
    )
  }

  let invoiceError: string | null = null

  if (withInvoice) {
    const result = await createAdminResetInvoice(
      session.user.id,
      ADMIN_RESET_CONFIG.verbeterrapport.invoiceLine,
    )
    invoiceError = result.error
  }

  revalidatePath(VERKOOPKLAAR_MAKEN_PATH)
  return { invoiceError }
}
