'use server'

import { type SupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

import { TurnstileVerifyResponseSchema } from '@features/auth/schema'
import { legacyApiFetch } from '@shared/api/legacyApiFetch'
import { requireRole } from '@shared/auth/guards'
import { getSession, requireSession } from '@shared/auth/session'
import { APPT_DEFAULT_AVAILABILITY } from '@shared/constants/availability'
import { getServerClient, getServiceRoleClient } from '@shared/supabase/server'

import {
  ACCOUNT_PATH,
  ADMIN_AFSPRAKEN_INSTELLINGEN_PATH,
  ADMIN_AFSPRAKEN_PATH,
  ADVISOR_FALLBACK_NAME,
  APPOINTMENT_BOOKINGS_TABLE,
  APPOINTMENT_CANCELLATION_CUSTOMER_TEMPLATE,
  APPOINTMENT_CONFIRMATION_CUSTOMER_TEMPLATE,
  APPOINTMENT_INVITATION_ADMIN_TEMPLATE,
  APPOINTMENT_TYPES_TABLE,
  CANCEL_MIN_NOTICE_MS,
  DEFAULT_DURATION_MIN,
  ICS_DATA_URI_PREFIX,
  ICS_FILE_NAME,
  MS_PER_MINUTE,
  SEND_TEMPLATE_ENDPOINT,
  SUPPORT_EMAIL,
  TURNSTILE_VERIFY_ENDPOINT,
} from './constants'
import {
  appointmentLocationLabel,
  fmtAppointmentDate,
  fmtAppointmentTime,
} from './lib/format'
import { buildIcsForBooking } from './lib/ics'
import { hasConflictForSlot, isAvailableForSlot } from './lib/slots'
import { ensureUniqueAppointmentSlug, slugifyAppointmentName } from './lib/slug'
import { getActiveTypeBySlug, getBookingContext, isUuid } from './queries'
import {
  AdminTypeFormSchema,
  AppointmentBookingRowSchema,
  BookingFormSchema,
  SendTemplateResponseSchema,
  type AdminTypeFormInput,
  type AppointmentBookingRow,
  type BookingFormInput,
} from './schema'
import { type BookingResult } from './types'

type ActionResult = { error: null } | { error: string }

interface SendTemplateAttachment {
  dataUrl: string
  fileName: string
}

interface SendTemplatePayload {
  templateId: string
  to: string
  vars: Record<string, string>
  attachments?: SendTemplateAttachment[]
  related?: Record<string, string | null>
}

const verifyTurnstileToken = async (token: string): Promise<boolean> => {
  const result = await legacyApiFetch(TURNSTILE_VERIFY_ENDPOINT, {
    body: JSON.stringify({ token }),
    method: 'POST',
    schema: TurnstileVerifyResponseSchema,
  })

  if (result.error !== null) {
    return true
  }

  return result.data.success
}

const sendTemplateEmail = async (
  payload: SendTemplatePayload,
): Promise<void> => {
  await legacyApiFetch(SEND_TEMPLATE_ENDPOINT, {
    body: JSON.stringify({ context: 'appointments', ...payload }),
    method: 'POST',
    schema: SendTemplateResponseSchema,
  })
}

const sendCancellationEmail = async (
  row: AppointmentBookingRow,
  supabase: SupabaseClient,
): Promise<void> => {
  const guestEmail = row.guest_email
  const startsAt = row.starts_at ? new Date(row.starts_at).getTime() : null
  const endsAt = row.ends_at ? new Date(row.ends_at).getTime() : null
  if (!guestEmail || startsAt === null || endsAt === null) {
    return
  }

  let typeName = 'jouw afspraak'
  if (row.appointment_type_id) {
    const { data } = await supabase
      .from(APPOINTMENT_TYPES_TABLE)
      .select('name')
      .eq('id', row.appointment_type_id)
      .maybeSingle()
    if (data?.name) {
      typeName = String(data.name)
    }
  }

  let advisorName = ADVISOR_FALLBACK_NAME
  let advisorEmail = SUPPORT_EMAIL
  let advisorPhone = ''
  if (row.admin_id && isUuid(row.admin_id)) {
    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name, email, phone')
      .eq('id', row.admin_id)
      .maybeSingle()
    if (data) {
      const name = `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim()
      if (name) {
        advisorName = name
      }
      if (data.email) {
        advisorEmail = String(data.email)
      }
      advisorPhone = data.phone ? String(data.phone) : ''
    }
  }

  try {
    await sendTemplateEmail({
      related: { userId: row.user_id },
      templateId: APPOINTMENT_CANCELLATION_CUSTOMER_TEMPLATE,
      to: guestEmail,
      vars: {
        adviseur_email: advisorEmail,
        adviseur_naam: advisorName,
        adviseur_telefoon: advisorPhone,
        afspraak_datum: fmtAppointmentDate(startsAt),
        afspraak_tijd: `${fmtAppointmentTime(startsAt)} – ${fmtAppointmentTime(endsAt)}`,
        afspraak_type: typeName,
        klantnaam: row.guest_name || '',
      },
    })
  } catch (emailError) {
    console.error('cancellation email error:', emailError)
  }
}

export const createBooking = async (
  input: BookingFormInput,
): Promise<BookingResult> => {
  const parsed = BookingFormSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ?? 'Controleer de ingevulde gegevens.',
      ok: false,
    }
  }

  const {
    email,
    firstName,
    lastName,
    notes,
    phone,
    preferredAdminId,
    startsAt,
    turnstileToken,
    typeSlug,
  } = parsed.data

  const isHuman = await verifyTurnstileToken(turnstileToken)
  if (!isHuman) {
    return { error: 'Bevestig dat je geen robot bent.', ok: false }
  }

  const type = await getActiveTypeBySlug(typeSlug)
  if (!type) {
    return { error: 'Afspraaktype niet gevonden.', ok: false }
  }

  const adminIds = type.assignedAdminIds
  if (adminIds.length === 0) {
    return {
      error: 'Geen medewerker gekoppeld aan dit afspraaktype.',
      ok: false,
    }
  }

  const duration = Number(type.duration) || DEFAULT_DURATION_MIN
  const slotEnd = startsAt + duration * MS_PER_MINUTE

  const { advisorsById, existingBookings } = await getBookingContext(type)

  const canTakeSlot = (adminId: string): boolean =>
    adminIds.includes(adminId) &&
    isAvailableForSlot(APPT_DEFAULT_AVAILABILITY, startsAt, slotEnd) &&
    !hasConflictForSlot(existingBookings, adminId, startsAt, slotEnd)

  let chosenAdminId: string | null = null
  if (preferredAdminId && canTakeSlot(preferredAdminId)) {
    chosenAdminId = preferredAdminId
  } else {
    for (const adminId of adminIds) {
      if (canTakeSlot(adminId)) {
        chosenAdminId = adminId
        break
      }
    }
  }

  if (!chosenAdminId) {
    return {
      error:
        'Dit tijdslot is helaas niet meer beschikbaar — kies een ander moment.',
      ok: false,
    }
  }

  const session = await getSession()
  const linkUserId =
    session &&
    session.user.email &&
    session.user.email.toLowerCase() === email.toLowerCase()
      ? session.user.id
      : null

  const guestName = `${firstName} ${lastName}`.trim()
  const guestEmail = email.trim()
  const guestPhone = phone.trim()
  const guestNotes = notes.trim()
  const bookingId = `apb_${crypto.randomUUID()}`

  const client = getServiceRoleClient()
  const { error } = await client.from(APPOINTMENT_BOOKINGS_TABLE).insert({
    admin_id: chosenAdminId,
    appointment_type_id: type.id,
    ends_at: new Date(slotEnd).toISOString(),
    guest_email: guestEmail,
    guest_first_name: firstName.trim(),
    guest_last_name: lastName.trim(),
    guest_name: guestName,
    guest_phone: guestPhone,
    id: bookingId,
    notes: guestNotes,
    starts_at: new Date(startsAt).toISOString(),
    status: 'confirmed',
    user_id: linkUserId,
  })

  if (error) {
    return {
      error: 'De boeking kon niet worden opgeslagen. Probeer het opnieuw.',
      ok: false,
    }
  }

  const advisor = advisorsById[chosenAdminId]
  const advisorName = advisor ? advisor.name : ADVISOR_FALLBACK_NAME
  const timeRange = `${fmtAppointmentTime(startsAt)} – ${fmtAppointmentTime(slotEnd)}`
  const durationLabel = `${type.duration || DEFAULT_DURATION_MIN} minuten`
  const locationLabel = appointmentLocationLabel(type)
  const ics = buildIcsForBooking({
    advisorEmail: advisor?.email ?? null,
    advisorName,
    booking: { endsAt: slotEnd, id: bookingId, notes: guestNotes, startsAt },
    customerEmail: guestEmail,
    customerName: guestName,
    type,
  })
  const icsDataUrl =
    ICS_DATA_URI_PREFIX + Buffer.from(ics, 'utf-8').toString('base64')

  try {
    await sendTemplateEmail({
      attachments: [{ dataUrl: icsDataUrl, fileName: ICS_FILE_NAME }],
      related: { userId: linkUserId },
      templateId: APPOINTMENT_CONFIRMATION_CUSTOMER_TEMPLATE,
      to: guestEmail,
      vars: {
        adviseur_email: advisor?.email || SUPPORT_EMAIL,
        adviseur_naam: advisorName,
        adviseur_telefoon: advisor?.phone || '',
        afspraak_datum: fmtAppointmentDate(startsAt),
        afspraak_duur: durationLabel,
        afspraak_locatie: locationLabel,
        afspraak_tijd: timeRange,
        afspraak_type: type.name,
        klantnaam: guestName,
      },
    })

    if (advisor?.email) {
      await sendTemplateEmail({
        attachments: [{ dataUrl: icsDataUrl, fileName: ICS_FILE_NAME }],
        related: {
          accountId: chosenAdminId,
          accountKind: 'admin',
          userId: linkUserId,
        },
        templateId: APPOINTMENT_INVITATION_ADMIN_TEMPLATE,
        to: advisor.email,
        vars: {
          adviseur_voornaam: advisor.firstName,
          afspraak_datum: fmtAppointmentDate(startsAt),
          afspraak_duur: durationLabel,
          afspraak_locatie: locationLabel,
          afspraak_tijd: timeRange,
          afspraak_type: type.name,
          klant_email: guestEmail,
          klant_telefoon: guestPhone,
          klantnaam: guestName,
          notities: guestNotes || '—',
        },
      })
    }
  } catch (emailError) {
    console.error('Appointment email error:', emailError)
  }

  revalidatePath(ACCOUNT_PATH)
  revalidatePath(ADMIN_AFSPRAKEN_PATH)

  return {
    adminName: advisorName,
    booking: { endsAt: slotEnd, guestEmail, startsAt },
    ok: true,
    type,
  }
}

export const adminSaveType = async (
  input: AdminTypeFormInput,
): Promise<ActionResult> => {
  const parsed = AdminTypeFormSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ?? 'Controleer de ingevulde gegevens.',
    }
  }

  const session = await requireRole('admin')
  const {
    active,
    advanceNoticeMin,
    assignedAdminIds,
    bufferAfter,
    color,
    description,
    duration,
    id,
    location,
    locationDetails,
    name,
    rollingDays,
    slug,
  } = parsed.data

  const slugBase = slugifyAppointmentName(slug || name)
  if (!slugBase) {
    return { error: 'Slug kon niet worden bepaald.' }
  }
  if (!/^[a-z0-9-]+$/.test(slugBase)) {
    return {
      error: 'Slug mag alleen kleine letters, cijfers en streepjes bevatten.',
    }
  }

  const supabase = await getServerClient()
  const { data: typeRows } = await supabase
    .from(APPOINTMENT_TYPES_TABLE)
    .select('id, slug')
  const existing = (typeRows ?? []).map(row => ({
    id: String(row.id),
    slug: String(row.slug),
  }))
  const uniqueSlug = ensureUniqueAppointmentSlug(slugBase, id ?? null, existing)

  const payload = {
    active,
    advance_notice_min: advanceNoticeMin,
    assigned_admin_ids: assignedAdminIds,
    buffer_after: bufferAfter,
    color,
    description: description || null,
    duration,
    id: id ?? `apt_${crypto.randomUUID()}`,
    location,
    location_details: locationDetails || null,
    name,
    rolling_days: rollingDays,
    slug: uniqueSlug,
    ...(id ? {} : { created_by: session.user.id }),
  }

  const { error } = await supabase.from(APPOINTMENT_TYPES_TABLE).upsert(payload)
  if (error) {
    return { error: 'Opslaan is mislukt. Probeer het opnieuw.' }
  }

  revalidatePath(ADMIN_AFSPRAKEN_INSTELLINGEN_PATH)
  return { error: null }
}

export const adminDeleteType = async (id: string): Promise<ActionResult> => {
  if (!id) {
    return { error: 'Ongeldig afspraaktype.' }
  }

  await requireRole('admin')
  const supabase = await getServerClient()
  const { error } = await supabase
    .from(APPOINTMENT_TYPES_TABLE)
    .delete()
    .eq('id', id)

  if (error) {
    return { error: 'Verwijderen is mislukt. Probeer het opnieuw.' }
  }

  revalidatePath(ADMIN_AFSPRAKEN_INSTELLINGEN_PATH)
  return { error: null }
}

export const adminCancelBooking = async (id: string): Promise<ActionResult> => {
  if (!id) {
    return { error: 'Ongeldige afspraak.' }
  }

  const session = await requireRole('admin')
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from(APPOINTMENT_BOOKINGS_TABLE)
    .update({
      cancelled_at: new Date().toISOString(),
      cancelled_by: session.user.id,
      status: 'cancelled',
    })
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (error || !data) {
    return { error: 'Annuleren is mislukt. Probeer het opnieuw.' }
  }

  const parsedRow = AppointmentBookingRowSchema.safeParse(data)
  if (parsedRow.success) {
    await sendCancellationEmail(parsedRow.data, supabase)
  }

  revalidatePath(ADMIN_AFSPRAKEN_PATH)
  return { error: null }
}

export const sendMyBookingCancellation = async (
  bookingId: string,
): Promise<ActionResult> => {
  const session = await requireSession()
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from(APPOINTMENT_BOOKINGS_TABLE)
    .select('*')
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !data) {
    return { error: 'Afspraak niet gevonden.' }
  }

  const parsedRow = AppointmentBookingRowSchema.safeParse(data)
  if (!parsedRow.success) {
    return { error: 'Afspraak niet gevonden.' }
  }

  const row = parsedRow.data
  const sessionEmail = session.user.email?.toLowerCase() ?? ''
  const isMine =
    row.user_id === session.user.id ||
    (!!row.guest_email && row.guest_email.toLowerCase() === sessionEmail)
  if (!isMine) {
    return { error: 'Je kunt alleen jouw eigen afspraken annuleren.' }
  }

  const startsAt = row.starts_at ? new Date(row.starts_at).getTime() : null
  if (startsAt !== null && startsAt - Date.now() < CANCEL_MIN_NOTICE_MS) {
    return {
      error:
        'Annuleren kan niet meer korter dan 1 uur vóór de afspraak. Bel ons direct.',
    }
  }

  await sendCancellationEmail(row, supabase)
  return { error: null }
}
