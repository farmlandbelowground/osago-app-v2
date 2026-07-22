import { OFFICE_LOCATION_FALLBACK, SUPPORT_EMAIL } from '../constants'
import { type AppointmentType } from '../types'

interface IcsBooking {
  endsAt: number
  id: string
  notes: string
  startsAt: number
}

interface BuildIcsParams {
  advisorEmail: string | null
  advisorName: string
  booking: IcsBooking
  customerEmail: string
  customerName: string
  type: AppointmentType
}

const formatUtc = (ts: number): string => {
  const date = new Date(ts)
  const pad = (value: number): string => String(value).padStart(2, '0')

  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
}

const escapeIcs = (value: string): string =>
  String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')

export const buildIcsForBooking = ({
  advisorEmail,
  advisorName,
  booking,
  customerEmail,
  customerName,
  type,
}: BuildIcsParams): string => {
  const summary = `Osago - ${customerName || 'klant'} - ${type.name}`

  const locationParts: string[] = []
  if (type.location === 'video') {
    locationParts.push(`Online (${type.locationDetails || 'Microsoft Teams'})`)
  } else if (type.location === 'phone') {
    locationParts.push(`Telefonisch (${type.locationDetails || ''})`)
  } else if (type.location === 'office') {
    locationParts.push(type.locationDetails || OFFICE_LOCATION_FALLBACK)
  } else {
    locationParts.push(type.locationDetails || '')
  }

  const description = [
    type.description || '',
    booking.notes ? `\n\nNotities van klant:\n${booking.notes}` : '',
  ].join('')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Osago//Booking Engine//NL',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${booking.id}@osago.nl`,
    `DTSTAMP:${formatUtc(Date.now())}`,
    `DTSTART:${formatUtc(booking.startsAt)}`,
    `DTEND:${formatUtc(booking.endsAt)}`,
    `SUMMARY:${escapeIcs(summary)}`,
    `LOCATION:${escapeIcs(locationParts.join(' · '))}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    `ORGANIZER;CN=${escapeIcs(advisorName)}:mailto:${escapeIcs(advisorEmail || SUPPORT_EMAIL)}`,
    `ATTENDEE;CN=${escapeIcs(customerName || '')};RSVP=TRUE:mailto:${escapeIcs(customerEmail || '')}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return lines.join('\r\n')
}
