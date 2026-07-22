export type LocationKind = 'office' | 'phone' | 'video'

export interface LocationOption {
  label: string
  value: LocationKind
}

export interface AppointmentType {
  active: boolean
  advanceNoticeMin: number
  assignedAdminIds: string[]
  bufferAfter: number
  color: string
  createdAt: number
  createdBy: string | null
  description: string
  duration: number
  id: string
  location: string
  locationDetails: string
  name: string
  rollingDays: number
  slug: string
}

export interface AppointmentBooking {
  adminId: string | null
  appointmentTypeId: string | null
  cancelledAt: number | null
  cancelledBy: string | null
  createdAt: number
  endsAt: number | null
  guestEmail: string
  guestFirstName: string
  guestLastName: string
  guestName: string
  guestPhone: string
  id: string
  notes: string
  startsAt: number | null
  status: string
  userId: string | null
}

export interface BookingSlot {
  adminId: string
  endsAt: number
  startsAt: number
}

export interface ExistingBooking {
  adminId: string | null
  endsAt: number | null
  startsAt: number | null
  status: string
}

export interface BookingPrefill {
  email: string
  firstName: string
  lastName: string
  phone: string
  userId: string | null
}

export interface ConfirmedBooking {
  endsAt: number
  guestEmail: string
  startsAt: number
}

export interface MyAppointmentView {
  advisorName: string
  endsAt: number
  id: string
  locationShort: string
  startsAt: number
  status: string
  typeName: string
}

export interface ResolvedAdvisor {
  email: string | null
  firstName: string
  id: string
  lastName: string
  name: string
  phone: string | null
}

export interface BookingContext {
  advisorsById: Record<string, ResolvedAdvisor>
  existingBookings: ExistingBooking[]
}

export interface Medewerker {
  email: string
  id: string
  name: string
}

export type BookingVariant = 'overlay' | 'standalone'

export type BookingResult =
  | {
      adminName: string
      booking: ConfirmedBooking
      ok: true
      type: AppointmentType
    }
  | { error: string; ok: false }

export type BookingSuccess = Extract<BookingResult, { ok: true }>
