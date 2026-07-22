import {
  type AppointmentType,
  type BookingPrefill,
  type BookingSlot,
  type MyAppointmentView,
} from '../../types'

export interface Props {
  appointments: MyAppointmentView[]
  ctaLabel: string
  ctaSlots: BookingSlot[]
  ctaType: AppointmentType | null
  prefill: BookingPrefill
}
