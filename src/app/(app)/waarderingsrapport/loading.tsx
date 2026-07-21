const skeletonStyle = {
  animation: 'pulse 2s ease-in-out infinite',
  background: 'var(--line-soft)',
  borderRadius: 'var(--radius)',
}

const cardStyle = { ...skeletonStyle, height: '300px', marginBottom: '24px' }

export default function Loading() {
  return (
    <main className="main">
      <div
        style={{
          ...skeletonStyle,
          height: '32px',
          marginBottom: '24px',
          width: '260px',
        }}
      />
      <div style={cardStyle} />
      <div style={cardStyle} />
      <div style={cardStyle} />
      <div style={cardStyle} />
    </main>
  )
}
