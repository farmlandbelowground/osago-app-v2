'use client'

import { type CSSProperties, type FC, useMemo, useState } from 'react'

import { MS_PER_DAY } from '../../constants'
import {
  appointmentLocationLabelShort,
  fmtAppointmentDate,
  fmtAppointmentTime,
} from '../../lib/format'
import { startOfDay } from '../../lib/slots'
import { type BookingSlot, type BookingSuccess } from '../../types'
import { BookingCalendar } from '../BookingCalendar'
import { BookingConfirmation } from '../BookingConfirmation'
import { BookingDetailsForm } from '../BookingDetailsForm'
import { BookingSlotPicker } from '../BookingSlotPicker'
import { type Props } from './types'

const ClockIcon: FC = () => (
  <svg
    fill="none"
    height="13"
    stroke="currentColor"
    strokeWidth="2"
    style={{ marginRight: 4, verticalAlign: -2 }}
    viewBox="0 0 24 24"
    width="13"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const PinIcon: FC = () => (
  <svg
    fill="none"
    height="13"
    stroke="currentColor"
    strokeWidth="2"
    style={{ marginRight: 4, verticalAlign: -2 }}
    viewBox="0 0 24 24"
    width="13"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

const CalendarIcon: FC = () => (
  <svg
    fill="none"
    height="13"
    stroke="currentColor"
    strokeWidth="2"
    style={{ marginRight: 4, verticalAlign: -2 }}
    viewBox="0 0 24 24"
    width="13"
  >
    <rect height="18" rx="2" width="18" x="3" y="4" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
)

export const BookingFlow: FC<Props> = ({
  onClose,
  prefill,
  slots,
  type,
  variant,
}) => {
  const cardStyle: CSSProperties = {
    background: '#fff',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: '0 4px 20px rgba(10,31,20,0.06)',
    margin: '40px auto',
    overflow: 'hidden',
  }

  const [today] = useState(() => startOfDay(Date.now()))
  const [monthCursor, setMonthCursor] = useState(() => startOfDay(Date.now()))
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null)
  const [confirmed, setConfirmed] = useState<BookingSuccess | null>(null)

  const slotsByDay = useMemo(() => {
    const map: Record<number, BookingSlot[]> = {}
    for (const slot of slots) {
      const dayKey = startOfDay(slot.startsAt)
      const daySlots = map[dayKey] ?? []
      if (!daySlots.some(existing => existing.startsAt === slot.startsAt)) {
        daySlots.push(slot)
      }
      map[dayKey] = daySlots
    }
    for (const key of Object.keys(map)) {
      map[Number(key)].sort((a, b) => a.startsAt - b.startsAt)
    }
    return map
  }, [slots])

  const horizonEnd = today + type.rollingDays * MS_PER_DAY
  const selectedSlots = selectedDay ? (slotsByDay[selectedDay] ?? []) : []

  const onSelectDay = (dayKey: number): void => {
    setSelectedDay(dayKey)
    setSelectedSlot(null)
  }

  const onClearSlot = (): void => {
    setSelectedSlot(null)
  }

  const overlayBack =
    variant === 'overlay' && !confirmed && onClose ? (
      <div style={{ margin: '0 auto 12px', maxWidth: 920, padding: '0 8px' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={onClose}
          style={{ alignItems: 'center', display: 'inline-flex', gap: 6 }}
          type="button"
        >
          <svg
            fill="none"
            height="14"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="14"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Terug naar Mijn account
        </button>
      </div>
    ) : null

  if (confirmed) {
    return (
      <>
        {overlayBack}
        <BookingConfirmation
          action={
            variant === 'overlay' && onClose ? (
              <button
                className="btn btn-primary"
                onClick={onClose}
                style={{ marginTop: 22 }}
                type="button"
              >
                Naar Mijn afspraken
              </button>
            ) : undefined
          }
          adminName={confirmed.adminName}
          booking={confirmed.booking}
          type={confirmed.type}
        />
      </>
    )
  }

  if (selectedSlot) {
    return (
      <>
        {overlayBack}
        <div style={{ ...cardStyle, maxWidth: 640 }}>
          <div
            style={{
              background: 'var(--green-soft)',
              borderBottom: '1px solid var(--green)',
              color: 'var(--ink)',
              padding: '24px 32px',
            }}
          >
            <div
              style={{
                alignItems: 'center',
                display: 'flex',
                gap: 10,
                marginBottom: 8,
              }}
            >
              <button
                className="btn btn-ghost btn-sm"
                onClick={onClearSlot}
                style={{ padding: '4px 10px' }}
                title="Terug naar kalender"
                type="button"
              >
                <svg
                  fill="none"
                  height="14"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ verticalAlign: -2 }}
                  viewBox="0 0 24 24"
                  width="14"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Terug
              </button>
              <div
                className="text-xs"
                style={{
                  color: 'var(--green-dark)',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Stap 2 · Jouw gegevens
              </div>
            </div>
            <h1
              style={{
                color: 'var(--green-dark)',
                fontFamily: "'Times New Roman', serif",
                fontSize: 26,
                fontWeight: 500,
                margin: '0 0 6px',
              }}
            >
              {type.name}
            </h1>
            <div
              style={{
                color: 'var(--green-dark)',
                display: 'flex',
                flexWrap: 'wrap',
                fontSize: 13,
                gap: 18,
              }}
            >
              <span>
                <CalendarIcon />
                {fmtAppointmentDate(selectedSlot.startsAt)}
              </span>
              <span>
                <ClockIcon />
                {fmtAppointmentTime(selectedSlot.startsAt)} –{' '}
                {fmtAppointmentTime(selectedSlot.endsAt)}
              </span>
              <span>
                <PinIcon />
                {appointmentLocationLabelShort(type)}
              </span>
            </div>
          </div>
          <div style={{ padding: '28px 32px' }}>
            <BookingDetailsForm
              onBack={onClearSlot}
              onConfirmed={setConfirmed}
              prefill={prefill}
              slot={selectedSlot}
              type={type}
            />
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {overlayBack}
      <div style={{ ...cardStyle, maxWidth: 920 }}>
        <div
          style={{
            background: 'var(--green-soft)',
            borderBottom: '1px solid var(--green)',
            color: 'var(--ink)',
            padding: '28px 32px',
          }}
        >
          <h1
            style={{
              color: 'var(--green-dark)',
              fontFamily: "'Times New Roman', serif",
              fontSize: 28,
              fontWeight: 500,
              margin: '0 0 6px',
            }}
          >
            {type.name}
          </h1>
          <div
            style={{
              color: 'var(--green-dark)',
              display: 'flex',
              flexWrap: 'wrap',
              fontSize: 13,
              gap: 18,
              marginTop: 10,
            }}
          >
            <span>
              <ClockIcon />
              {type.duration} minuten
            </span>
            <span>
              <PinIcon />
              {appointmentLocationLabelShort(type)}
            </span>
          </div>
          {type.description && (
            <p
              style={{
                color: 'var(--ink-2)',
                fontSize: 13.5,
                lineHeight: 1.55,
                margin: '14px 0 0',
                maxWidth: 680,
              }}
            >
              {type.description}
            </p>
          )}
        </div>

        <div
          style={{ display: 'grid', gap: 0, gridTemplateColumns: '1fr 280px' }}
        >
          <BookingCalendar
            color={type.color}
            horizonEnd={horizonEnd}
            monthCursor={monthCursor}
            onMonthCursorChange={setMonthCursor}
            onSelectDay={onSelectDay}
            selectedDay={selectedDay}
            slotsByDay={slotsByDay}
            today={today}
          />
          <BookingSlotPicker
            onSelectSlot={setSelectedSlot}
            selectedDay={selectedDay}
            slots={selectedSlots}
          />
        </div>
      </div>
    </>
  )
}
