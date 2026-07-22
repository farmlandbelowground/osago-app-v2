import {
  type AppointmentType,
  type BookingPrefill,
  type BookingSlot,
} from '../../types'

export interface Props {
  label: string
  prefill: BookingPrefill
  slots: BookingSlot[]
  type: AppointmentType
}
