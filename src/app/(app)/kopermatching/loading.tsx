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
          marginBottom: '24px',
          width: '220px',
        }}
      />
      <div style={{ ...skeletonStyle, height: '44px', marginBottom: '20px' }} />
      <div className="grid-2 grid">
        <div style={{ ...skeletonStyle, height: '220px' }} />
        <div style={{ ...skeletonStyle, height: '220px' }} />
      </div>
    </main>
  )
}
