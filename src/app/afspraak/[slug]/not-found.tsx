import { BookingNotFound } from '@features/appointments'

export default function NotFound() {
  return (
    <main
      style={{
        background: 'var(--bg)',
        minHeight: '100vh',
        padding: '24px 16px',
      }}
    >
      <BookingNotFound />
    </main>
  )
}
