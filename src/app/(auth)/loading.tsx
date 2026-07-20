export default function Loading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
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
  )
}
