'use client'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ reset }: Props) {
  return (
    <html lang="en">
      <body
        className={`
          flex min-h-screen items-center justify-center bg-background
          text-foreground
        `}
      >
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-xl font-semibold">Application error</h2>
          <p className="text-foreground/70">An unexpected error occurred.</p>
          <button
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
