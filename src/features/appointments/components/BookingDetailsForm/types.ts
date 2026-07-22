import {
  type AppointmentType,
  type BookingPrefill,
  type BookingSlot,
  type BookingSuccess,
} from '../../types'

export interface Props {
  onBack: () => void
  onConfirmed: (result: BookingSuccess) => void
  slot: BookingSlot
  type: AppointmentType
  prefill?: BookingPrefill | null
}
