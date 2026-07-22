import { type BookingSlot } from '../../types'

export interface Props {
  onSelectSlot: (slot: BookingSlot) => void
  selectedDay: number | null
  slots: BookingSlot[]
}
