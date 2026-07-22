'use client'

import { useState, type FC } from 'react'

import { useAdminAvailabilityStore } from '@features/auth/store'
import { ModalShell } from '@shared/components/ModalShell'
import {
  APPT_DEFAULT_AVAILABILITY,
  APPT_WEEKDAY_LABELS,
  APPT_WEEKDAYS,
  AVAILABILITY_DEFAULT_SLOT_END,
  AVAILABILITY_DEFAULT_SLOT_START,
  AVAILABILITY_TIMEZONE,
} from '@shared/constants/availability'
import { useToastStore } from '@shared/store/toast'
import { type Availability } from '@shared/types/availability'

import { type Props } from './types'

interface DayRow {
  end: string
  isOpen: boolean
  start: string
}

export const TeamScheduleModal: FC<Props> = ({
  adminId,
  memberName,
  onClose,
}) => {
  const showToast = useToastStore(state => state.showToast)
  const availabilityByAdminId = useAdminAvailabilityStore(
    state => state.availabilityByAdminId,
  )
  const setAvailability = useAdminAvailabilityStore(
    state => state.setAvailability,
  )

  const [rows, setRows] = useState<Record<string, DayRow>>(() => {
    const current = availabilityByAdminId[adminId] ?? APPT_DEFAULT_AVAILABILITY
    const initial: Record<string, DayRow> = {}

    for (const day of APPT_WEEKDAYS) {
      const first = current[day][0] ?? null
      initial[day] = {
        end: first ? first.end : AVAILABILITY_DEFAULT_SLOT_END,
        isOpen: Boolean(first),
        start: first ? first.start : AVAILABILITY_DEFAULT_SLOT_START,
      }
    }

    return initial
  })

  const update = (day: string, patch: Partial<DayRow>): void => {
    setRows(current => ({ ...current, [day]: { ...current[day], ...patch } }))
  }

  const onSave = (): void => {
    const next: Availability = {
      friday: [],
      monday: [],
      saturday: [],
      sunday: [],
      thursday: [],
      timezone:
        availabilityByAdminId[adminId]?.timezone ?? AVAILABILITY_TIMEZONE,
      tuesday: [],
      wednesday: [],
    }

    for (const day of APPT_WEEKDAYS) {
      const row = rows[day]
      if (row.isOpen) {
        if (!row.start || !row.end || row.end <= row.start) {
          showToast(
            `Eindtijd op ${APPT_WEEKDAY_LABELS[day]} moet ná de starttijd liggen.`,
            'error',
          )
          return
        }
        next[day] = [{ end: row.end, start: row.start }]
      }
    }

    setAvailability(adminId, next)
    showToast('Rooster opgeslagen.')
    onClose()
  }

  const footer = (
    <>
      <button className="btn btn-secondary" onClick={onClose} type="button">
        Annuleren
      </button>
      <button className="btn btn-primary" onClick={onSave} type="button">
        Rooster opslaan
      </button>
    </>
  )

  return (
    <ModalShell footer={footer} onClose={onClose} title={`Rooster — ${memberName}`}>
      <p className="desc">
        Bepaal per dag de begin- en eindtijd waarop deze medewerker via de
        afspraken-boekingslink beschikbaar is. Vink een dag uit om die volledig
        dicht te zetten.
      </p>
      <div style={{ marginTop: 10 }}>
        {APPT_WEEKDAYS.map(day => (
          <div
            key={day}
            style={{
              alignItems: 'center',
              borderBottom: '1px solid var(--line-soft)',
              display: 'grid',
              gap: 10,
              gridTemplateColumns: '120px 24px 1fr 1fr',
              padding: '8px 0',
            }}
          >
            <label style={{ fontSize: 13.5, fontWeight: 500 }}>
              {APPT_WEEKDAY_LABELS[day]}
            </label>
            <input
              checked={rows[day].isOpen}
              onChange={event => update(day, { isOpen: event.target.checked })}
              type="checkbox"
            />
            <input
              disabled={!rows[day].isOpen}
              onChange={event => update(day, { start: event.target.value })}
              type="time"
              value={rows[day].start}
            />
            <input
              disabled={!rows[day].isOpen}
              onChange={event => update(day, { end: event.target.value })}
              type="time"
              value={rows[day].end}
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted" style={{ marginTop: 14 }}>
        Het rooster wordt lokaal in deze browser bewaard (net als in de oude
        app); een centrale opslag is toekomstig werk.
      </p>
    </ModalShell>
  )
}
