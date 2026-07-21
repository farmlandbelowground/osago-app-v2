const skeletonStyle = {
  animation: 'pulse 2s ease-in-out infinite',
  background: 'var(--line-soft)',
  borderRadius: 'var(--radius)',
}

const cardStyle = { ...skeletonStyle, height: '320px', marginBottom: '24px' }

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
      <div
        style={{
          ...skeletonStyle,
          height: '40px',
          marginBottom: '24px',
          width: '100%',
        }}
      />
      <div style={cardStyle} />
      <div style={cardStyle} />
    </main>
  )
}
