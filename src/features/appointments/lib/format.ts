import { AVAILABILITY_TIMEZONE } from '@shared/constants/availability'

import { OFFICE_LOCATION_FALLBACK } from '../constants'
import { type AppointmentType } from '../types'

export const fmtAppointmentTime = (ts: number): string =>
  new Date(ts).toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: AVAILABILITY_TIMEZONE,
  })

export const fmtAppointmentDate = (ts: number): string =>
  new Date(ts).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    timeZone: AVAILABILITY_TIMEZONE,
    weekday: 'long',
    year: 'numeric',
  })

export const fmtAppointmentRange = (startsAt: number, endsAt: number): string =>
  `${fmtAppointmentDate(startsAt)} · ${fmtAppointmentTime(startsAt)} – ${fmtAppointmentTime(endsAt)}`

export const appointmentLocationLabel = (type: AppointmentType): string => {
  if (type.location === 'video') {
    return `Online — ${type.locationDetails || 'Microsoft Teams (link wordt apart toegestuurd)'}`
  }

  if (type.location === 'phone') {
    return `Telefonisch — ${type.locationDetails || 'Wij bellen jou op het opgegeven nummer'}`
  }

  if (type.location === 'office') {
    return type.locationDetails || OFFICE_LOCATION_FALLBACK
  }

  return type.locationDetails || '—'
}

export const appointmentLocationLabelShort = (
  type: AppointmentType,
): string => {
  if (type.location === 'video') {
    return 'Online'
  }

  if (type.location === 'phone') {
    return 'Telefoon'
  }

  if (type.location === 'office') {
    return 'Op kantoor'
  }

  return type.locationDetails || '—'
}
