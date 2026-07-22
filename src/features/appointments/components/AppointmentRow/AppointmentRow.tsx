import { type FC } from 'react'

import { fmtAppointmentDate, fmtAppointmentTime } from '../../lib/format'
import { type Props } from './types'

export const AppointmentRow: FC<Props> = ({ action, appointment }) => (
  <div
    style={{
      alignItems: 'flex-start',
      borderTop: '1px solid var(--line-soft)',
      display: 'flex',
      gap: 14,
      padding: '14px 0',
    }}
  >
    <div
      style={{
        alignItems: 'center',
        background: 'var(--green-soft)',
        borderRadius: 10,
        color: 'var(--green-dark)',
        display: 'flex',
        flexShrink: 0,
        height: 44,
        justifyContent: 'center',
        width: 44,
      }}
    >
      <svg
        fill="none"
        height="22"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="22"
      >
        <rect height="18" rx="2" width="18" x="3" y="4" />
        <line x1="16" x2="16" y1="2" y2="6" />
        <line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
      </svg>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          color: 'var(--ink)',
          fontSize: 14,
          fontWeight: 600,
          marginBottom: 2,
        }}
      >
        {appointment.typeName}
      </div>
      <div className="text-sm text-muted" style={{ lineHeight: 1.5 }}>
        {fmtAppointmentDate(appointment.startsAt)} ·{' '}
        {fmtAppointmentTime(appointment.startsAt)} –{' '}
        {fmtAppointmentTime(appointment.endsAt)}
        <br />
        <span style={{ color: 'var(--muted)' }}>
          Met {appointment.advisorName} · {appointment.locationShort}
        </span>
      </div>
    </div>
    <div style={{ flexShrink: 0 }}>{action}</div>
  </div>
)
