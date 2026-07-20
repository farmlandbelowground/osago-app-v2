const skeletonStyle = {
  animation: 'pulse 2s ease-in-out infinite',
  background: 'var(--line-soft)',
  borderRadius: 'var(--radius)',
}

export default function Loading() {
  return (
    <div className="ob-shell">
      <div className="ob-topbar">
        <div style={{ ...skeletonStyle, height: 26, width: 96 }} />
        <div style={{ ...skeletonStyle, flex: 1, height: 40 }} />
      </div>
      <div className="ob-body">
        <div className="ob-content">
          <div style={{ ...skeletonStyle, height: 400 }} />
        </div>
      </div>
      <div className="ob-footer">
        <div />
        <div style={{ ...skeletonStyle, height: 40, width: 160 }} />
      </div>
    </div>
  )
}
