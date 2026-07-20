const skeletonStyle = {
  animation: 'pulse 2s ease-in-out infinite',
  background: 'var(--line-soft)',
  borderRadius: 'var(--radius)',
}

export default function Loading() {
  return (
    <main className="main">
      <div
        style={{
          ...skeletonStyle,
          height: '32px',
          width: '220px',
          marginBottom: '24px',
        }}
      />
      <div style={{ ...skeletonStyle, height: '80px', marginBottom: '24px' }} />
      <div className="grid-2 grid" style={{ marginBottom: '24px' }}>
        <div style={{ ...skeletonStyle, height: '220px' }} />
        <div style={{ ...skeletonStyle, height: '220px' }} />
      </div>
      <div style={{ ...skeletonStyle, height: '160px' }} />
    </main>
  )
}
