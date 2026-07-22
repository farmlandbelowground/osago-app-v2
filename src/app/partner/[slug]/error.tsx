'use client'

import { useEffect } from 'react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: Props) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main
      style={{
        background: 'var(--bg)',
        minHeight: '100vh',
        padding: '24px 16px',
      }}
    >
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
            Er ging iets mis
          </h1>
          <p style={{ color: 'var(--muted)', margin: '0 0 20px' }}>
            De registratiepagina kon niet worden geladen. Probeer het opnieuw.
          </p>
          <button className="btn btn-primary" onClick={reset} type="button">
            Opnieuw proberen
          </button>
        </div>
      </div>
    </main>
  )
}
