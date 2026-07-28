import { type CSSProperties } from 'react'

export const PARAGRAPH_STYLE: CSSProperties = {
  lineHeight: 1.6,
  margin: '0 0 12px',
}

export const LEAD_STYLE: CSSProperties = {
  lineHeight: 1.6,
  margin: '0 0 8px',
}

export const TABLE_STYLE: CSSProperties = {
  borderCollapse: 'collapse',
  fontSize: '13px',
  lineHeight: 1.55,
  marginTop: '4px',
  width: '100%',
}

export const TD_LABEL_STYLE: CSSProperties = {
  color: 'var(--muted)',
  padding: '5px 0',
  verticalAlign: 'top',
}

export const TD_VALUE_STYLE: CSSProperties = {
  color: 'var(--ink)',
  fontVariantNumeric: 'tabular-nums',
  fontWeight: 600,
  padding: '5px 0',
  textAlign: 'right',
  verticalAlign: 'top',
}
