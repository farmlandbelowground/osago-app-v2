'use client'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AuthError({ reset }: Props) {
  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Er ging iets mis</h2>
      <p className="alert alert-error">
        Probeer het opnieuw of vernieuw de pagina.
      </p>
      <button className="btn btn-primary" onClick={reset}>
        Opnieuw proberen
      </button>
    </div>
  )
}
