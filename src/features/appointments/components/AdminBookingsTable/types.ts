import {
  type AppointmentBooking,
  type AppointmentType,
  type Medewerker,
} from '../../types'

export interface Props {
  bookings: AppointmentBooking[]
  canCancel: boolean
  medewerkers: Medewerker[]
  types: AppointmentType[]
}
