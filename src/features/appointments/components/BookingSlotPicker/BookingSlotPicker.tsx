'use client'

import { type CSSProperties, type FC } from 'react'

import { fmtAppointmentTime } from '../../lib/format'
import { type Props } from './types'

export const BookingSlotPicker: FC<Props> = ({
  onSelectSlot,
  selectedDay,
  slots,
}) => {
  const emptyStyle: CSSProperties = {
    color: 'var(--muted)',
    fontSize: 13.5,
    lineHeight: 1.5,
    margin: 'auto',
    textAlign: 'center',
  }

  return (
    <div
      style={{
        background: 'var(--line-soft)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        padding: '24px 24px',
      }}
    >
      {!selectedDay ? (
        <div style={emptyStyle}>
          Selecteer
          <br />
          een dag
          <br />
          links
        </div>
      ) : slots.length === 0 ? (
        <div style={emptyStyle}>
          Geen vrije tijden
          <br />
          op deze dag
        </div>
      ) : (
        <>
          <div
            style={{
              flexShrink: 0,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 10,
            }}
          >
            Kies een tijd
          </div>
          <div
            style={{
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              gap: 6,
              minHeight: 0,
              overflowY: 'auto',
              paddingRight: 4,
            }}
          >
            {slots.map(slot => (
              <button
                key={slot.startsAt}
                onClick={() => onSelectSlot(slot)}
                style={{
                  background: '#fff',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  fontSize: 14,
                  fontWeight: 600,
                  padding: '10px 14px',
                  textAlign: 'center',
                }}
                type="button"
              >
                {fmtAppointmentTime(slot.startsAt)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
