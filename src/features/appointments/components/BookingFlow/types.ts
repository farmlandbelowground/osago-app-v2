import {
  type AppointmentType,
  type BookingPrefill,
  type BookingSlot,
  type BookingVariant,
} from '../../types'

export interface Props {
  slots: BookingSlot[]
  type: AppointmentType
  variant: BookingVariant
  onClose?: () => void
  prefill?: BookingPrefill | null
}
