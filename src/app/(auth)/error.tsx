'use client'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AuthError({ reset }: Props) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h2 className="text-xl font-semibold">Er ging iets mis</h2>
      <p className="text-muted-foreground">
        Probeer het opnieuw of vernieuw de pagina.
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
      >
        Opnieuw proberen
      </button>
    </div>
  )
}
