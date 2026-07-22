'use client'

import { useRouter } from 'next/navigation'
import { type FC, useState } from 'react'

import { KpiTile } from '@shared/components/KpiTile'
import { useToastStore } from '@shared/store/toast'

import { adminCancelBooking } from '../../actions'
import {
  appointmentLocationLabelShort,
  fmtAppointmentDate,
  fmtAppointmentTime,
} from '../../lib/format'
import { type AppointmentBooking, type AppointmentType } from '../../types'
import { type Props } from './types'

export const AdminBookingsTable: FC<Props> = ({
  bookings,
  canCancel,
  medewerkers,
  types,
}) => {
  const router = useRouter()
  const showToast = useToastStore(state => state.showToast)
  const [now] = useState(() => Date.now())

  const typesById = new Map<string, AppointmentType>(
    types.map(item => [item.id, item]),
  )
  const nameById = new Map(medewerkers.map(item => [item.id, item.name]))

  const upcoming = bookings.filter(
    item =>
      item.status !== 'cancelled' &&
      item.startsAt !== null &&
      item.startsAt >= now,
  ).length
  const past = bookings.filter(
    item => item.startsAt !== null && item.startsAt < now,
  ).length
  const cancelled = bookings.filter(item => item.status === 'cancelled').length

  const onCancel = async (booking: AppointmentBooking): Promise<void> => {
    const startsAt = booking.startsAt
    const confirmed = window.confirm(
      `Annuleer de afspraak met ${booking.guestName} op ${startsAt !== null ? fmtAppointmentDate(startsAt) : ''} om ${startsAt !== null ? fmtAppointmentTime(startsAt) : ''}?\n\nDe klant ontvangt automatisch een annuleringsbevestiging per e-mail.`,
    )
    if (!confirmed) {
      return
    }

    const result = await adminCancelBooking(booking.id)
    if (result.error) {
      showToast(result.error, 'error')
      return
    }

    showToast('Afspraak geannuleerd — klant heeft bevestiging ontvangen.')
    router.refresh()
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Geboekte afspraken</h1>
        </div>
      </div>

      <div className="grid-3 mb-5 grid">
        <KpiTile
          label="Komende afspraken"
          meta="In de toekomst gepland"
          value={String(upcoming)}
        />
        <KpiTile
          label="Voorbije afspraken"
          meta="Reeds plaatsgevonden"
          value={String(past)}
        />
        <KpiTile
          label="Geannuleerd"
          meta="Niet doorgegaan"
          value={String(cancelled)}
        />
      </div>

      {bookings.length === 0 ? (
        <div className="card">
          <div className="empty" style={{ padding: '48px 24px' }}>
            <h3>Nog geen boekingen</h3>
            <p>
              Zodra klanten een afspraak via de boekingslink reserveren
              verschijnen ze hier.
            </p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div style={{ margin: '0 -24px -24px', overflowX: 'auto' }}>
            <table style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: 24 }}>Klant</th>
                  <th>Afspraaktype</th>
                  <th>Datum &amp; tijd</th>
                  <th>Medewerker</th>
                  <th>Status</th>
                  <th className="right" style={{ paddingRight: 24 }} />
                </tr>
              </thead>
              <tbody>
                {bookings.map(booking => {
                  const type = booking.appointmentTypeId
                    ? typesById.get(booking.appointmentTypeId)
                    : undefined
                  const advisorName = booking.adminId
                    ? nameById.get(booking.adminId)
                    : undefined
                  const isUpcoming =
                    booking.startsAt !== null &&
                    booking.startsAt >= now &&
                    booking.status !== 'cancelled'

                  return (
                    <tr key={booking.id}>
                      <td style={{ paddingLeft: 24 }}>
                        <strong>{booking.guestName || '—'}</strong>
                        <div className="text-xs text-muted">
                          {booking.guestEmail}
                          {booking.guestPhone ? ` · ${booking.guestPhone}` : ''}
                        </div>
                      </td>
                      <td>
                        {type ? type.name : '—'}
                        <div className="text-xs text-muted">
                          {type ? appointmentLocationLabelShort(type) : ''}
                        </div>
                      </td>
                      <td>
                        <strong>
                          {booking.startsAt !== null
                            ? fmtAppointmentDate(booking.startsAt)
                            : '—'}
                        </strong>
                        <div className="text-xs text-muted">
                          {booking.startsAt !== null && booking.endsAt !== null
                            ? `${fmtAppointmentTime(booking.startsAt)} – ${fmtAppointmentTime(booking.endsAt)}`
                            : ''}
                        </div>
                      </td>
                      <td>{advisorName || '—'}</td>
                      <td>
                        {booking.status === 'cancelled' ? (
                          <span className="badge badge-gray">Geannuleerd</span>
                        ) : isUpcoming ? (
                          <span className="badge badge-green">Komend</span>
                        ) : (
                          <span className="badge badge-gray">Voorbij</span>
                        )}
                      </td>
                      <td className="right" style={{ paddingRight: 24 }}>
                        {booking.status !== 'cancelled' && canCancel && (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => void onCancel(booking)}
                            title="Annuleren"
                            type="button"
                          >
                            Annuleren
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
