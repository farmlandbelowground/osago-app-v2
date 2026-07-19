'use client'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ reset }: Props) {
  return (
    <html lang="en">
      <body
        style={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h2>Application error</h2>
          <p className="alert alert-error">An unexpected error occurred.</p>
          <button className="btn btn-primary" onClick={reset}>
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
