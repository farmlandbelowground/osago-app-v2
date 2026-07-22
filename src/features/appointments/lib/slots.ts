import {
  APPT_DEFAULT_AVAILABILITY,
  APPT_WEEKDAYS,
  AVAILABILITY_TIMEZONE,
} from '@shared/constants/availability'
import { type Availability } from '@shared/types/availability'

import { DEFAULT_DURATION_MIN, MS_PER_MINUTE } from '../constants'
import {
  type AppointmentType,
  type BookingSlot,
  type ExistingBooking,
} from '../types'

interface ZonedParts {
  day: number
  hour: number
  minute: number
  month: number
  weekday: number
  year: number
}

// Slot generation ran client-side in legacy (in the visitor's browser, which for
// the Dutch audience was Europe/Amsterdam). v2 generates slots server-side, so the
// wall-clock math is anchored to AVAILABILITY_TIMEZONE — a naive local-time port
// would shift every slot by the server's UTC offset in production.
export const getZonedParts = (epochMs: number): ZonedParts => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    timeZone: AVAILABILITY_TIMEZONE,
    year: 'numeric',
  })
  const lookup: Record<string, string> = {}
  for (const part of formatter.formatToParts(new Date(epochMs))) {
    if (part.type !== 'literal') {
      lookup[part.type] = part.value
    }
  }
  const year = Number(lookup.year)
  const month = Number(lookup.month) - 1
  const day = Number(lookup.day)
  const weekday = new Date(Date.UTC(year, month, day)).getUTCDay()

  return {
    day,
    hour: Number(lookup.hour),
    minute: Number(lookup.minute),
    month,
    weekday,
    year,
  }
}

export const zonedWallToEpoch = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): number => {
  const guess = Date.UTC(year, month, day, hour, minute)
  const parts = getZonedParts(guess)
  const guessAsUtc = Date.UTC(
    parts.year,
    parts.month,
    parts.day,
    parts.hour,
    parts.minute,
  )

  return guess - (guessAsUtc - guess)
}

export const startOfDay = (ts: number): number => {
  const parts = getZonedParts(ts)

  return zonedWallToEpoch(parts.year, parts.month, parts.day, 0, 0)
}

export const combineDateTime = (dayEpoch: number, hhmm: string): number => {
  const parts = getZonedParts(dayEpoch)
  const [rawHour, rawMinute] = String(hhmm).split(':')

  return zonedWallToEpoch(
    parts.year,
    parts.month,
    parts.day,
    Number(rawHour) || 0,
    Number(rawMinute) || 0,
  )
}

export const isAvailableForSlot = (
  availability: Availability,
  startsAt: number,
  endsAt: number,
): boolean => {
  const weekday = APPT_WEEKDAYS[getZonedParts(startsAt).weekday]
  const windows = availability[weekday] || []
  if (windows.length === 0) {
    return false
  }

  return windows.some(win => {
    const winStart = combineDateTime(startsAt, win.start)
    const winEnd = combineDateTime(startsAt, win.end)

    return startsAt >= winStart && endsAt <= winEnd
  })
}

export const hasConflictForSlot = (
  existingBookings: readonly ExistingBooking[],
  adminId: string,
  startsAt: number,
  endsAt: number,
): boolean =>
  existingBookings.some(
    booking =>
      booking.adminId === adminId &&
      booking.status !== 'cancelled' &&
      booking.startsAt !== null &&
      booking.endsAt !== null &&
      !(booking.endsAt <= startsAt || booking.startsAt >= endsAt),
  )

export const generateAppointmentSlots = (
  type: AppointmentType,
  adminAvailabilityById: Record<string, Availability>,
  existingBookings: readonly ExistingBooking[],
  fromTs: number,
  toTs: number,
): BookingSlot[] => {
  const adminIds = Array.isArray(type.assignedAdminIds)
    ? type.assignedAdminIds
    : []
  if (adminIds.length === 0) {
    return []
  }

  const duration = Number(type.duration) || DEFAULT_DURATION_MIN
  const buffer = Number(type.bufferAfter) || 0
  const advance = (Number(type.advanceNoticeMin) || 0) * MS_PER_MINUTE
  const earliest = Date.now() + advance
  const durationMs = duration * MS_PER_MINUTE
  const bufferMs = buffer * MS_PER_MINUTE
  const slots: BookingSlot[] = []

  const firstDay = getZonedParts(startOfDay(fromTs))
  let dayIndex = 0
  let dayStart = startOfDay(fromTs)

  while (dayStart <= toTs) {
    const weekday = APPT_WEEKDAYS[getZonedParts(dayStart).weekday]

    for (const adminId of adminIds) {
      const availability =
        adminAvailabilityById[adminId] ?? APPT_DEFAULT_AVAILABILITY
      const windows = availability[weekday] || []

      for (const win of windows) {
        let cursor = combineDateTime(dayStart, win.start)
        const winEnd = combineDateTime(dayStart, win.end)

        while (cursor + durationMs <= winEnd) {
          const slotStart = cursor
          const slotEnd = cursor + durationMs

          if (slotStart >= earliest && slotStart <= toTs) {
            const conflict = hasConflictForSlot(
              existingBookings,
              adminId,
              slotStart,
              slotEnd,
            )
            if (!conflict) {
              slots.push({ adminId, endsAt: slotEnd, startsAt: slotStart })
            }
          }

          cursor = slotEnd + bufferMs
        }
      }
    }

    dayIndex += 1
    dayStart = zonedWallToEpoch(
      firstDay.year,
      firstDay.month,
      firstDay.day + dayIndex,
      0,
      0,
    )
  }

  return slots
}
