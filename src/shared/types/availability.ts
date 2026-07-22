export interface AvailabilitySlot {
  end: string
  start: string
}

export type AvailabilityWeekday =
  | 'friday'
  | 'monday'
  | 'saturday'
  | 'sunday'
  | 'thursday'
  | 'tuesday'
  | 'wednesday'

export interface Availability {
  friday: AvailabilitySlot[]
  monday: AvailabilitySlot[]
  saturday: AvailabilitySlot[]
  sunday: AvailabilitySlot[]
  thursday: AvailabilitySlot[]
  timezone: string
  tuesday: AvailabilitySlot[]
  wednesday: AvailabilitySlot[]
}
