'use client'

import { useState, type FC } from 'react'

import { useToastStore } from '@shared/store/toast'

import {
  APPT_DEFAULT_AVAILABILITY,
  APPT_WEEKDAYS,
  APPT_WEEKDAY_LABELS,
  AVAILABILITY_DEFAULT_SLOT_END,
  AVAILABILITY_DEFAULT_SLOT_START,
} from '../../constants'
import { useAdminAvailabilityStore } from '../../store'
import { type Availability, type AvailabilityWeekday } from '../../store/types'
import { type Props } from './types'

const addSlot = (
  availability: Availability,
  day: AvailabilityWeekday,
): Availability => ({
  ...availability,
  [day]: [
    ...availability[day],
    {
      end: AVAILABILITY_DEFAULT_SLOT_END,
      start: AVAILABILITY_DEFAULT_SLOT_START,
    },
  ],
})

const removeSlot = (
  availability: Availability,
  day: AvailabilityWeekday,
  index: number,
): Availability => ({
  ...availability,
  [day]: availability[day].filter((_, slotIndex) => slotIndex !== index),
})

const updateSlot = (
  availability: Availability,
  day: AvailabilityWeekday,
  index: number,
  field: 'end' | 'start',
  value: string,
): Availability => ({
  ...availability,
  [day]: availability[day].map((slot, slotIndex) =>
    slotIndex === index ? { ...slot, [field]: value } : slot,
  ),
})

const hasInvalidSlot = (availability: Availability): boolean =>
  APPT_WEEKDAYS.some(day =>
    availability[day].some(slot => slot.start >= slot.end),
  )

export const AdminAvailabilityCard: FC<Props> = ({ adminId }) => {
  const showToast = useToastStore(state => state.showToast)
  const storedAvailability = useAdminAvailabilityStore(
    state => state.availabilityByAdminId[adminId],
  )
  const setStoredAvailability = useAdminAvailabilityStore(
    state => state.setAvailability,
  )
  const [draft, setDraft] = useState<Availability | null>(null)
  const availability = draft ?? storedAvailability ?? APPT_DEFAULT_AVAILABILITY

  const onSave = (next: Availability): void => {
    if (hasInvalidSlot(next)) {
      showToast('Eindtijd moet na de starttijd liggen.', 'error')
      return
    }

    setStoredAvailability(adminId, next)
    setDraft(next)
    showToast('Beschikbaarheid opgeslagen.')
  }

  const onReset = (): void => {
    if (
      !window.confirm(
        'Weet je zeker dat je de beschikbaarheid wilt terugzetten naar de standaardwaarden?',
      )
    ) {
      return
    }

    onSave(APPT_DEFAULT_AVAILABILITY)
  }

  return (
    <div className="card mb-5">
      <h3 style={{ margin: '0 0 4px' }}>Beschikbaarheid voor afspraken</h3>
      <p className="desc">
        Werkuren waarop klanten je via de boekingslink kunnen reserveren. Per
        dag een of meer tijdsvensters; laat een dag leeg om die volledig dicht
        te houden.
      </p>

      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}
      >
        {APPT_WEEKDAYS.map(day => (
          <div
            key={day}
            style={{
              alignItems: 'center',
              borderBottom: '1px solid var(--line-soft)',
              display: 'flex',
              gap: 14,
              padding: '8px 0',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, width: 90 }}>
              {APPT_WEEKDAY_LABELS[day]}
            </div>
            <div
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {availability[day].length === 0 ? (
                <span className="text-xs text-muted">Niet beschikbaar</span>
              ) : (
                availability[day].map((slot, index) => (
                  <div
                    key={`${day}-${index}`}
                    style={{ alignItems: 'center', display: 'flex', gap: 6 }}
                  >
                    <input
                      onChange={event =>
                        setDraft(
                          updateSlot(
                            availability,
                            day,
                            index,
                            'start',
                            event.target.value,
                          ),
                        )
                      }
                      style={{ fontSize: 13, padding: '4px 8px', width: 100 }}
                      type="time"
                      value={slot.start}
                    />
                    <span className="text-muted">–</span>
                    <input
                      onChange={event =>
                        setDraft(
                          updateSlot(
                            availability,
                            day,
                            index,
                            'end',
                            event.target.value,
                          ),
                        )
                      }
                      style={{ fontSize: 13, padding: '4px 8px', width: 100 }}
                      type="time"
                      value={slot.end}
                    />
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() =>
                        setDraft(removeSlot(availability, day, index))
                      }
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setDraft(addSlot(availability, day))}
              type="button"
            >
              + Tijdsvenster
            </button>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'flex-end',
          marginTop: 14,
        }}
      >
        <button className="btn btn-secondary" onClick={onReset} type="button">
          Standaardwaarden
        </button>
        <button
          className="btn btn-primary"
          onClick={() => onSave(availability)}
          type="button"
        >
          Beschikbaarheid opslaan
        </button>
      </div>
    </div>
  )
}
