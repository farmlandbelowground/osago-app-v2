import { type CSSProperties, type FC } from 'react'

import { splitMyAppointments } from '../../lib/appointmentGroups'
import { AppointmentRow } from '../AppointmentRow'
import { InAppBookingLauncher } from '../InAppBookingLauncher'
import { MyAppointmentCancelButton } from '../MyAppointmentCancelButton'
import { type Props } from './types'

export const MyAppointmentsSection: FC<Props> = ({
  appointments,
  ctaLabel,
  ctaSlots,
  ctaType,
  prefill,
}) => {
  const { cancelled, past, upcoming } = splitMyAppointments(appointments)

  const summaryStyle: CSSProperties = {
    alignItems: 'center',
    border: '1px solid var(--line)',
    borderRadius: 99,
    color: 'var(--muted)',
    cursor: 'pointer',
    display: 'inline-flex',
    fontSize: 12.5,
    gap: 8,
    listStyle: 'none',
    padding: '6px 12px',
    userSelect: 'none',
  }

  return (
    <div className="card mb-5">
      <div
        className="flex-between mb-3"
        style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}
      >
        <div>
          <h3>Mijn afspraken</h3>
          <p className="desc" style={{ marginBottom: 0 }}>
            Overzicht van afspraken die je via Osago hebt ingepland. Annuleren
            kan tot 1 uur vóór aanvang.
          </p>
        </div>
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          {upcoming.length > 0 && (
            <span className="badge badge-green">
              {upcoming.length} {upcoming.length === 1 ? 'komend' : 'komende'}
            </span>
          )}
          {ctaType && (
            <InAppBookingLauncher
              label={ctaLabel}
              prefill={prefill}
              slots={ctaSlots}
              type={ctaType}
            />
          )}
        </div>
      </div>

      {appointments.length === 0 ? (
        <div className="empty" style={{ padding: '36px 20px' }}>
          <div className="empty-icon">
            <svg
              fill="none"
              height="24"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="24"
            >
              <rect height="18" rx="2" width="18" x="3" y="4" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
          </div>
          <h3>Nog geen afspraken</h3>
          <p>
            Zodra je een afspraak met een Osago-adviseur inplant, verschijnt
            deze hier. Vraag jouw adviseur of het Helpcentrum naar de
            boekingslink.
          </p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <>
              <div
                className="text-xs text-muted fw-600"
                style={{
                  letterSpacing: '0.05em',
                  marginTop: 6,
                  textTransform: 'uppercase',
                }}
              >
                Komende afspraken
              </div>
              {upcoming.map(appointment => (
                <MyAppointmentCancelButton
                  appointment={appointment}
                  key={appointment.id}
                />
              ))}
            </>
          )}

          {past.length > 0 && (
            <details style={{ marginTop: 14 }}>
              <summary style={summaryStyle}>
                {past.length} voorbije afspra{past.length === 1 ? 'ak' : 'ken'}{' '}
                ›
              </summary>
              <div style={{ marginTop: 6 }}>
                {past.map(appointment => (
                  <AppointmentRow
                    action={<span className="badge badge-green">Geweest</span>}
                    appointment={appointment}
                    key={appointment.id}
                  />
                ))}
              </div>
            </details>
          )}

          {cancelled.length > 0 && (
            <details style={{ marginTop: 10 }}>
              <summary style={summaryStyle}>
                {cancelled.length} geannuleerde afspra
                {cancelled.length === 1 ? 'ak' : 'ken'} ›
              </summary>
              <div style={{ marginTop: 6 }}>
                {cancelled.map(appointment => (
                  <AppointmentRow
                    action={
                      <span className="badge badge-gray">Geannuleerd</span>
                    }
                    appointment={appointment}
                    key={appointment.id}
                  />
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  )
}
