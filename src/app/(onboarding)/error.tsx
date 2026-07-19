'use client'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ reset }: Props) {
  return (
    <div className="empty">
      <h3>Er ging iets mis</h3>
      <p>
        Probeer de pagina opnieuw te laden. Blijft het probleem bestaan, neem
        dan contact op met Osago.
      </p>
      <button className="btn btn-primary" onClick={reset} type="button">
        Opnieuw proberen
      </button>
    </div>
  )
}
