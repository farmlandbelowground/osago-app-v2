import { AdminBookingsTable } from '@features/appointments'
import {
  adminListBookings,
  adminListMedewerkers,
  adminListTypes,
} from '@features/appointments/queries'
import { requireRole } from '@shared/auth/guards'

export default async function AdminAfsprakenPage() {
  const session = await requireRole('admin_user')

  const [bookings, types, medewerkers] = await Promise.all([
    adminListBookings(),
    adminListTypes(),
    adminListMedewerkers(),
  ])

  return (
    <main className="main">
      <AdminBookingsTable
        bookings={bookings}
        canCancel={session.role === 'admin'}
        medewerkers={medewerkers}
        types={types}
      />
    </main>
  )
}
