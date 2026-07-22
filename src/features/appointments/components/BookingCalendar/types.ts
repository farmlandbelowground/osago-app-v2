import { type BookingSlot } from '../../types'

export interface Props {
  color: string
  horizonEnd: number
  monthCursor: number
  onMonthCursorChange: (cursor: number) => void
  onSelectDay: (dayKey: number) => void
  selectedDay: number | null
  slotsByDay: Record<number, BookingSlot[]>
  today: number
}
