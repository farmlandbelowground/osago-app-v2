import { type CSSProperties } from 'react'

// The white totals table beneath the slider (osago-bundle.js:5698-5711).
export const TOTALS_TABLE_STYLE: CSSProperties = {
  background: '#fff',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  marginTop: '18px',
  overflow: 'hidden',
}

export const TOTALS_ROW_STYLE: CSSProperties = {
  alignItems: 'center',
  display: 'grid',
  gap: '8px 22px',
  gridTemplateColumns: '1fr auto',
  padding: '8px 16px',
}

export const TOTALS_TOTAL_ROW_STYLE: CSSProperties = {
  ...TOTALS_ROW_STYLE,
  background: 'var(--green-soft)',
  borderTop: '2px solid var(--green-dark)',
  marginTop: '6px',
  padding: '12px 16px',
}

export const TOTALS_LABEL_STYLE: CSSProperties = {
  color: 'var(--ink)',
  fontSize: '13.5px',
  fontWeight: 500,
}

export const TOTALS_VALUE_STYLE: CSSProperties = {
  color: 'var(--ink)',
  fontSize: '14px',
  fontVariantNumeric: 'tabular-nums',
  fontWeight: 600,
  textAlign: 'right',
}

export const TOTALS_TOTAL_LABEL_STYLE: CSSProperties = {
  color: 'var(--green-dark)',
  fontSize: '14.5px',
  fontWeight: 700,
}

export const TOTALS_TOTAL_VALUE_STYLE: CSSProperties = {
  color: 'var(--green-dark)',
  fontSize: '15px',
  fontVariantNumeric: 'tabular-nums',
  fontWeight: 700,
  textAlign: 'right',
}
