import { type MyAppointmentView } from '../types'

interface GroupedAppointments {
  cancelled: MyAppointmentView[]
  past: MyAppointmentView[]
  upcoming: MyAppointmentView[]
}

export const splitMyAppointments = (
  appointments: MyAppointmentView[],
): GroupedAppointments => {
  const now = Date.now()

  return {
    cancelled: appointments
      .filter(item => item.status === 'cancelled')
      .sort((a, b) => b.startsAt - a.startsAt),
    past: appointments
      .filter(item => item.status === 'confirmed' && item.startsAt < now)
      .sort((a, b) => b.startsAt - a.startsAt),
    upcoming: appointments
      .filter(item => item.status === 'confirmed' && item.startsAt >= now)
      .sort((a, b) => a.startsAt - b.startsAt),
  }
}
