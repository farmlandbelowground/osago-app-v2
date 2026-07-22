export default function Loading() {
  return (
    <main className="main">
      <div className="empty" style={{ padding: '36px 20px' }}>
        <div className="empty-icon">
          <span
            style={{
              animation: 'spin360 .8s linear infinite',
              border: '2px solid currentColor',
              borderRadius: '50%',
              borderTopColor: 'transparent',
              display: 'inline-block',
              height: 18,
              width: 18,
            }}
          />
        </div>
        <p className="text-muted">Beheerpaneel laden…</p>
      </div>
    </main>
  )
}
