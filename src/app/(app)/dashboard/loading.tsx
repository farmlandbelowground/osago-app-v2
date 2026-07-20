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
          width: '192px',
        }}
      />
      <div className="grid-3 mb-5 grid">
        <div style={{ ...skeletonStyle, height: '104px' }} />
        <div style={{ ...skeletonStyle, height: '104px' }} />
        <div style={{ ...skeletonStyle, height: '104px' }} />
      </div>
      <div
        style={{ ...skeletonStyle, height: '240px', marginBottom: '24px' }}
      />
      <div style={{ ...skeletonStyle, height: '320px' }} />
    </main>
  )
}
