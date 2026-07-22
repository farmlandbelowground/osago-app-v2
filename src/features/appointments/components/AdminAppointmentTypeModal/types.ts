import { type AppointmentType, type Medewerker } from '../../types'

export interface Props {
  admins: Medewerker[]
  bookingCount: number
  onClose: () => void
  type: AppointmentType | null
}
