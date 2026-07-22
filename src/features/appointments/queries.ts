import { getSession } from '@shared/auth/session'
import { getServerClient, getServiceRoleClient } from '@shared/supabase/server'

import {
  ADVISOR_FALLBACK_NAME,
  APPOINTMENT_BOOKINGS_TABLE,
  APPOINTMENT_TYPES_TABLE,
  DEFAULT_APPOINTMENT_COLOR,
  DEFAULT_LOCATION_KIND,
  MS_PER_DAY,
} from './constants'
import { appointmentLocationLabelShort } from './lib/format'
import { generateAppointmentSlots, startOfDay } from './lib/slots'
import {
  AdvisorProfileRowSchema,
  AppointmentBookingRowSchema,
  AppointmentTypeRowSchema,
  ExistingBookingRowSchema,
  MedewerkerRowSchema,
  type AppointmentBookingRow,
  type AppointmentTypeRow,
} from './schema'
import {
  type AppointmentBooking,
  type AppointmentType,
  type BookingContext,
  type BookingSlot,
  type ExistingBooking,
  type Medewerker,
  type MyAppointmentView,
  type ResolvedAdvisor,
} from './types'

export const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

const rowToAppointmentType = (row: AppointmentTypeRow): AppointmentType => ({
  active: row.active !== false,
  advanceNoticeMin: row.advance_notice_min,
  assignedAdminIds: Array.isArray(row.assigned_admin_ids)
    ? row.assigned_admin_ids
    : [],
  bufferAfter: row.buffer_after,
  color: row.color || DEFAULT_APPOINTMENT_COLOR,
  createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  createdBy: row.created_by || null,
  description: row.description || '',
  duration: row.duration,
  id: row.id,
  location: row.location || DEFAULT_LOCATION_KIND,
  locationDetails: row.location_details || '',
  name: row.name,
  rollingDays: row.rolling_days,
  slug: row.slug,
})

const rowToAppointmentBooking = (
  row: AppointmentBookingRow,
): AppointmentBooking => ({
  adminId: row.admin_id,
  appointmentTypeId: row.appointment_type_id,
  cancelledAt: row.cancelled_at ? new Date(row.cancelled_at).getTime() : null,
  cancelledBy: row.cancelled_by,
  createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  endsAt: row.ends_at ? new Date(row.ends_at).getTime() : null,
  guestEmail: row.guest_email || '',
  guestFirstName: row.guest_first_name || '',
  guestLastName: row.guest_last_name || '',
  guestName: row.guest_name || '',
  guestPhone: row.guest_phone || '',
  id: row.id,
  notes: row.notes || '',
  startsAt: row.starts_at ? new Date(row.starts_at).getTime() : null,
  status: row.status || 'confirmed',
  userId: row.user_id || null,
})

export const getActiveTypeBySlug = async (
  slug: string,
): Promise<AppointmentType | null> => {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from(APPOINTMENT_TYPES_TABLE)
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  const parsed = AppointmentTypeRowSchema.safeParse(data)

  return parsed.success ? rowToAppointmentType(parsed.data) : null
}

export const adminListTypes = async (): Promise<AppointmentType[]> => {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from(APPOINTMENT_TYPES_TABLE)
    .select('*')
    .order('name', { ascending: true })

  if (error || !data) {
    return []
  }

  return data.flatMap(row => {
    const parsed = AppointmentTypeRowSchema.safeParse(row)

    return parsed.success ? [rowToAppointmentType(parsed.data)] : []
  })
}

export const adminListBookings = async (): Promise<AppointmentBooking[]> => {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from(APPOINTMENT_BOOKINGS_TABLE)
    .select('*')
    .order('starts_at', { ascending: false })

  if (error || !data) {
    return []
  }

  return data.flatMap(row => {
    const parsed = AppointmentBookingRowSchema.safeParse(row)

    return parsed.success ? [rowToAppointmentBooking(parsed.data)] : []
  })
}

export const getMyBookings = async (): Promise<MyAppointmentView[]> => {
  const session = await getSession()

  if (!session) {
    return []
  }

  const supabase = await getServerClient()
  const email = session.user.email ?? ''
  const orFilter = email
    ? `user_id.eq.${session.user.id},guest_email.eq.${email}`
    : `user_id.eq.${session.user.id}`

  const { data, error } = await supabase
    .from(APPOINTMENT_BOOKINGS_TABLE)
    .select('*')
    .or(orFilter)

  if (error || !data) {
    return []
  }

  const { data: typeData } = await supabase
    .from(APPOINTMENT_TYPES_TABLE)
    .select('*')
  const typesById = new Map<string, AppointmentType>()
  for (const row of typeData ?? []) {
    const parsed = AppointmentTypeRowSchema.safeParse(row)
    if (parsed.success) {
      const type = rowToAppointmentType(parsed.data)
      typesById.set(type.id, type)
    }
  }

  return data.flatMap(row => {
    const parsed = AppointmentBookingRowSchema.safeParse(row)
    if (!parsed.success) {
      return []
    }

    const booking = rowToAppointmentBooking(parsed.data)
    if (booking.startsAt === null || booking.endsAt === null) {
      return []
    }

    const type = booking.appointmentTypeId
      ? typesById.get(booking.appointmentTypeId)
      : undefined

    return [
      {
        advisorName: ADVISOR_FALLBACK_NAME,
        endsAt: booking.endsAt,
        id: booking.id,
        locationShort: type ? appointmentLocationLabelShort(type) : '—',
        startsAt: booking.startsAt,
        status: booking.status,
        typeName: type ? type.name : 'Afspraak',
      },
    ]
  })
}

export const adminListMedewerkers = async (): Promise<Medewerker[]> => {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, role')
    .in('role', ['admin', 'admin_user'])

  if (error || !data) {
    return []
  }

  return data.flatMap(row => {
    const parsed = MedewerkerRowSchema.safeParse(row)
    if (!parsed.success) {
      return []
    }

    const name =
      `${parsed.data.first_name ?? ''} ${parsed.data.last_name ?? ''}`.trim() ||
      (parsed.data.email ?? '')

    return [{ email: parsed.data.email ?? '', id: parsed.data.id, name }]
  })
}

export const getBookingContext = async (
  type: AppointmentType,
): Promise<BookingContext> => {
  const client = getServiceRoleClient()
  const adminIds = type.assignedAdminIds
  const uuidIds = adminIds.filter(isUuid)

  const advisorsById: Record<string, ResolvedAdvisor> = {}
  if (uuidIds.length > 0) {
    const { data } = await client
      .from('profiles')
      .select('id, first_name, last_name, email, phone')
      .in('id', uuidIds)

    for (const row of data ?? []) {
      const parsed = AdvisorProfileRowSchema.safeParse(row)
      if (!parsed.success) {
        continue
      }

      const firstName = parsed.data.first_name ?? ''
      const lastName = parsed.data.last_name ?? ''
      advisorsById[parsed.data.id] = {
        email: parsed.data.email,
        firstName,
        id: parsed.data.id,
        lastName,
        name: `${firstName} ${lastName}`.trim() || ADVISOR_FALLBACK_NAME,
        phone: parsed.data.phone,
      }
    }
  }

  const existingBookings: ExistingBooking[] = []
  if (adminIds.length > 0) {
    const { data } = await client
      .from(APPOINTMENT_BOOKINGS_TABLE)
      .select('admin_id, starts_at, ends_at, status')
      .in('admin_id', adminIds)
      .neq('status', 'cancelled')

    for (const row of data ?? []) {
      const parsed = ExistingBookingRowSchema.safeParse(row)
      if (!parsed.success) {
        continue
      }

      existingBookings.push({
        adminId: parsed.data.admin_id,
        endsAt: parsed.data.ends_at
          ? new Date(parsed.data.ends_at).getTime()
          : null,
        startsAt: parsed.data.starts_at
          ? new Date(parsed.data.starts_at).getTime()
          : null,
        status: parsed.data.status,
      })
    }
  }

  return { advisorsById, existingBookings }
}

export const getSlotsForType = async (
  type: AppointmentType,
): Promise<BookingSlot[]> => {
  const { existingBookings } = await getBookingContext(type)
  const from = startOfDay(Date.now())
  const to = from + type.rollingDays * MS_PER_DAY

  return generateAppointmentSlots(type, {}, existingBookings, from, to)
}
