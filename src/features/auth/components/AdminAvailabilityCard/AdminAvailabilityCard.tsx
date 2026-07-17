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
    <div
      className={`mb-6 rounded-lg border border-border bg-surface p-6 shadow-sm`}
    >
      <h2 className="mb-1 font-serif text-[17px] font-medium text-foreground">
        Beschikbaarheid voor afspraken
      </h2>
      <p className="mb-3.5 text-[13px] text-muted-foreground">
        Werkuren waarop klanten je via de boekingslink kunnen reserveren. Per
        dag een of meer tijdsvensters; laat een dag leeg om die volledig dicht
        te houden.
      </p>

      <div className="flex flex-col gap-2">
        {APPT_WEEKDAYS.map(day => (
          <div
            className={`
              flex items-center gap-3.5 border-b border-border py-2
              last:border-b-0
            `}
            key={day}
          >
            <div className="w-[90px] text-[13px] font-semibold text-foreground">
              {APPT_WEEKDAY_LABELS[day]}
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              {availability[day].length === 0 ? (
                <span className="text-xs text-muted-foreground">
                  Niet beschikbaar
                </span>
              ) : (
                availability[day].map((slot, index) => (
                  <div
                    className="flex items-center gap-1.5"
                    key={`${day}-${index}`}
                  >
                    <input
                      className={`
                        w-[100px] rounded-md border border-border bg-surface
                        px-2 py-1 text-[13px]
                      `}
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
                      type="time"
                      value={slot.start}
                    />
                    <span className="text-muted-foreground">–</span>
                    <input
                      className={`
                        w-[100px] rounded-md border border-border bg-surface
                        px-2 py-1 text-[13px]
                      `}
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
                      type="time"
                      value={slot.end}
                    />
                    <button
                      className={`
                        rounded-md px-2 py-1 text-sm text-muted-foreground
                        hover:bg-border-soft
                      `}
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
              className={`
                rounded-md border border-border bg-surface px-3 py-1.5
                text-[13px] font-semibold text-foreground
                hover:bg-border-soft
              `}
              onClick={() => setDraft(addSlot(availability, day))}
              type="button"
            >
              + Tijdsvenster
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3.5 flex justify-end gap-2">
        <button
          className={`
            inline-flex items-center justify-center rounded-md border
            border-border bg-surface px-5 py-3 text-sm font-semibold
            text-foreground transition
            hover:bg-border-soft
          `}
          onClick={onReset}
          type="button"
        >
          Standaardwaarden
        </button>
        <button
          className={`
            inline-flex items-center justify-center gap-2 rounded-md bg-primary
            px-5 py-3 text-sm font-semibold text-primary-foreground transition
            hover:-translate-y-px hover:bg-primary-hover
            hover:shadow-[0_4px_12px_rgba(0,179,60,0.25)]
          `}
          onClick={() => onSave(availability)}
          type="button"
        >
          Beschikbaarheid opslaan
        </button>
      </div>
    </div>
  )
}
