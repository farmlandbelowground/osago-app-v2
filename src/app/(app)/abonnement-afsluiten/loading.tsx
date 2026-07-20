export default function Loading() {
  return (
    <main className="main">
      <div className="empty" style={{ padding: '80px 20px' }}>
        <div className="empty-icon">
          <span
            style={{
              display: 'inline-block',
              width: 18,
              height: 18,
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin360 .8s linear infinite',
            }}
          />
        </div>
        <p className="text-muted">Abonnementen laden…</p>
      </div>
    </main>
  )
}
