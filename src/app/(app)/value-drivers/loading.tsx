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
          width: '200px',
          marginBottom: '24px',
        }}
      />
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          style={{ ...skeletonStyle, height: '140px', marginBottom: '20px' }}
        />
      ))}
    </main>
  )
}
