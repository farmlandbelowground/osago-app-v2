import { AVAILABILITY_TIMEZONE } from '@shared/constants/availability'

import { MONDAY_FIRST_OFFSET, WEEK_LENGTH } from '../constants'
import { getZonedParts, zonedWallToEpoch } from './slots'

interface MonthDay {
  dayKey: number
  dayNumber: number
}

interface MonthGrid {
  days: MonthDay[]
  month: number
  monthLabel: string
  nextCursor: number
  prevCursor: number
  startWeekday: number
  year: number
}

export const buildMonthGrid = (monthCursor: number): MonthGrid => {
  const { month, year } = getZonedParts(monthCursor)
  const firstOfMonth = zonedWallToEpoch(year, month, 1, 0, 0)
  const startWeekday =
    (getZonedParts(firstOfMonth).weekday + MONDAY_FIRST_OFFSET) % WEEK_LENGTH
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()

  const days: MonthDay[] = []
  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
    days.push({
      dayKey: zonedWallToEpoch(year, month, dayNumber, 0, 0),
      dayNumber,
    })
  }

  return {
    days,
    month,
    monthLabel: new Date(firstOfMonth).toLocaleDateString('nl-NL', {
      month: 'long',
      timeZone: AVAILABILITY_TIMEZONE,
      year: 'numeric',
    }),
    nextCursor: zonedWallToEpoch(year, month + 1, 1, 0, 0),
    prevCursor: zonedWallToEpoch(year, month - 1, 1, 0, 0),
    startWeekday,
    year,
  }
}
