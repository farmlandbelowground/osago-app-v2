import {
  type Availability,
  type AvailabilityWeekday,
} from '@shared/types/availability'

export const APPT_WEEKDAYS: readonly AvailabilityWeekday[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]

export const APPT_WEEKDAY_LABELS: Record<AvailabilityWeekday, string> = {
  friday: 'Vrijdag',
  monday: 'Maandag',
  saturday: 'Zaterdag',
  sunday: 'Zondag',
  thursday: 'Donderdag',
  tuesday: 'Dinsdag',
  wednesday: 'Woensdag',
}

export const AVAILABILITY_TIMEZONE = 'Europe/Amsterdam'
export const AVAILABILITY_DEFAULT_SLOT_START = '09:00'
export const AVAILABILITY_DEFAULT_SLOT_END = '17:00'

export const APPT_DEFAULT_AVAILABILITY: Availability = {
  friday: [
    {
      end: AVAILABILITY_DEFAULT_SLOT_END,
      start: AVAILABILITY_DEFAULT_SLOT_START,
    },
  ],
  monday: [
    {
      end: AVAILABILITY_DEFAULT_SLOT_END,
      start: AVAILABILITY_DEFAULT_SLOT_START,
    },
  ],
  saturday: [],
  sunday: [],
  thursday: [
    {
      end: AVAILABILITY_DEFAULT_SLOT_END,
      start: AVAILABILITY_DEFAULT_SLOT_START,
    },
  ],
  timezone: AVAILABILITY_TIMEZONE,
  tuesday: [
    {
      end: AVAILABILITY_DEFAULT_SLOT_END,
      start: AVAILABILITY_DEFAULT_SLOT_START,
    },
  ],
  wednesday: [
    {
      end: AVAILABILITY_DEFAULT_SLOT_END,
      start: AVAILABILITY_DEFAULT_SLOT_START,
    },
  ],
}
