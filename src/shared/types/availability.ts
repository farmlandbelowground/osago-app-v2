import { z } from 'zod'

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

const AvailabilitySlotSchema = z.object({
  end: z.string(),
  start: z.string(),
})

// Validates the weekday→slots + timezone shape consumed by
// generateAppointmentSlots. Kept in sync with the Availability interface above.
export const AvailabilitySchema: z.ZodType<Availability> = z.object({
  friday: z.array(AvailabilitySlotSchema),
  monday: z.array(AvailabilitySlotSchema),
  saturday: z.array(AvailabilitySlotSchema),
  sunday: z.array(AvailabilitySlotSchema),
  thursday: z.array(AvailabilitySlotSchema),
  timezone: z.string(),
  tuesday: z.array(AvailabilitySlotSchema),
  wednesday: z.array(AvailabilitySlotSchema),
})
