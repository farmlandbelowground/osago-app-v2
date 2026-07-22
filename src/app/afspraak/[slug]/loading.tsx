export default function Loading() {
  return (
    <main
      style={{
        background: 'var(--bg)',
        minHeight: '100vh',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          color: 'var(--muted)',
          margin: '80px auto',
          maxWidth: 560,
          textAlign: 'center',
        }}
      >
        <div
          className="serif"
          style={{ color: 'var(--ink)', fontSize: 20, marginBottom: 8 }}
        >
          Boekingspagina laden…
        </div>
        <div style={{ fontSize: 14 }}>Een ogenblik geduld.</div>
      </div>
    </main>
  )
}
