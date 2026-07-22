import { type FC } from 'react'

import {
  appointmentLocationLabel,
  fmtAppointmentDate,
  fmtAppointmentTime,
} from '../../lib/format'
import { type Props } from './types'

export const BookingConfirmation: FC<Props> = ({
  action,
  adminName,
  booking,
  type,
}) => {
  return (
    <div style={{ margin: '40px auto', maxWidth: 560 }}>
      <div
        style={{
          background: '#fff',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px 28px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            alignItems: 'center',
            background: 'var(--green-soft)',
            borderRadius: '50%',
            color: 'var(--green-dark)',
            display: 'inline-flex',
            height: 60,
            justifyContent: 'center',
            marginBottom: 16,
            width: 60,
          }}
        >
          <svg
            fill="none"
            height="30"
            stroke="currentColor"
            strokeWidth="3"
            viewBox="0 0 24 24"
            width="30"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="serif" style={{ fontSize: 26, margin: '0 0 8px' }}>
          Afspraak bevestigd
        </h1>
        <p style={{ color: 'var(--muted)', margin: '0 0 22px' }}>
          We hebben jouw afspraak ingepland en een bevestiging naar{' '}
          <strong style={{ color: 'var(--ink)' }}>{booking.guestEmail}</strong>{' '}
          gestuurd, inclusief een agenda-bestand.
        </p>
        <div
          style={{
            background: 'var(--line-soft)',
            borderRadius: 'var(--radius)',
            fontSize: 13.5,
            lineHeight: 1.6,
            padding: 16,
            textAlign: 'left',
          }}
        >
          <div>
            <strong>{type.name}</strong>
          </div>
          <div style={{ color: 'var(--muted)' }}>
            {fmtAppointmentDate(booking.startsAt)} ·{' '}
            {fmtAppointmentTime(booking.startsAt)}–
            {fmtAppointmentTime(booking.endsAt)}
          </div>
          <div style={{ color: 'var(--muted)' }}>Met: {adminName}</div>
          <div style={{ color: 'var(--muted)' }}>
            Locatie: {appointmentLocationLabel(type)}
          </div>
        </div>
        {action}
      </div>
    </div>
  )
}
