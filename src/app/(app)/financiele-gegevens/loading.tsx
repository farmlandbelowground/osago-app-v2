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
          width: '240px',
          marginBottom: '24px',
        }}
      />
      <div
        style={{ ...skeletonStyle, height: '420px', marginBottom: '24px' }}
      />
      <div
        style={{ ...skeletonStyle, height: '200px', marginBottom: '24px' }}
      />
      <div style={{ ...skeletonStyle, height: '180px' }} />
    </main>
  )
}
