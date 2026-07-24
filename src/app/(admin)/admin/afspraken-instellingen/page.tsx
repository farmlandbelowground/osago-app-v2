import { type Metadata } from 'next'

import { AdminAppointmentTypesGrid } from '@features/appointments'
import {
  adminListBookings,
  adminListMedewerkers,
  adminListTypes,
} from '@features/appointments/queries'
import { requireRole } from '@shared/auth/guards'

export const metadata: Metadata = {
  title: 'Afspraaktypen',
}

export default async function AdminAfspraakInstellingenPage() {
  await requireRole('admin')

  const [types, bookings, medewerkers] = await Promise.all([
    adminListTypes(),
    adminListBookings(),
    adminListMedewerkers(),
  ])

  return (
    <main className="main">
      <AdminAppointmentTypesGrid
        bookings={bookings}
        medewerkers={medewerkers}
        types={types}
      />
    </main>
  )
}
