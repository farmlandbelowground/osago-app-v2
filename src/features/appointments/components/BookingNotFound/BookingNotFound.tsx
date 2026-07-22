import { type FC } from 'react'

export const BookingNotFound: FC = () => {
  return (
    <div style={{ margin: '80px auto', maxWidth: 560, textAlign: 'center' }}>
      <div
        style={{
          background: '#fff',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px 28px',
        }}
      >
        <h1 className="serif" style={{ fontSize: 24, margin: '0 0 10px' }}>
          Boekingspagina niet gevonden
        </h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>
          Deze afspraakpagina bestaat niet (meer) of is niet beschikbaar.
          Controleer de link of neem contact op met Osago.
        </p>
      </div>
    </div>
  )
}
