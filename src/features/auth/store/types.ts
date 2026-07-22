import { type Availability } from '@shared/types/availability'

export interface AdminAvailabilityStore {
  availabilityByAdminId: Record<string, Availability>
  setAvailability: (adminId: string, availability: Availability) => void
}
