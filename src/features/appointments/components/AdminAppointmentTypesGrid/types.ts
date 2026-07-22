import {
  type AppointmentBooking,
  type AppointmentType,
  type Medewerker,
} from '../../types'

export interface Props {
  bookings: AppointmentBooking[]
  medewerkers: Medewerker[]
  types: AppointmentType[]
}
