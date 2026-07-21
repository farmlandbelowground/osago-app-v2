import { LEAD_STAGES } from '@features/leads/constants/stages'

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
      <div
        style={{
          display: 'grid',
          gap: '16px',
          gridTemplateColumns: `repeat(${LEAD_STAGES.length}, 1fr)`,
        }}
      >
        {LEAD_STAGES.map(stage => (
          <div key={stage.id} style={{ ...skeletonStyle, height: '320px' }} />
        ))}
      </div>
    </main>
  )
}
