'use client'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ reset }: Props) {
  return (
    <div className={`
      mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-16 text-center
    `}>
      <h2 className="text-xl font-semibold text-foreground">
        Er ging iets mis
      </h2>
      <p className="text-muted-foreground">
        Probeer de pagina opnieuw te laden. Blijft het probleem bestaan, neem
        dan contact op met Osago.
      </p>
      <button
        className={`
          rounded-md bg-primary px-4 py-2 text-white
          hover:bg-primary-hover
        `}
        onClick={reset}
        type="button"
      >
        Opnieuw proberen
      </button>
    </div>
  )
}
