'use client'

import { type FC } from 'react'

import { type Props } from './types'

// Ports adminSearchInputHTML (osago-bundle.js:2893) — a search input with the
// magnifier icon inset on the left.
export const AdminSearchInput: FC<Props> = ({
  onChange,
  placeholder,
  value,
}) => {
  return (
    <div style={{ maxWidth: '100%', position: 'relative', width: 280 }}>
      <svg
        fill="none"
        height="14"
        stroke="currentColor"
        strokeWidth="2"
        style={{
          color: 'var(--muted)',
          left: 10,
          pointerEvents: 'none',
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
        }}
        viewBox="0 0 24 24"
        width="14"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        style={{ fontSize: 13, padding: '8px 12px 8px 32px', width: '100%' }}
        type="text"
        value={value}
      />
    </div>
  )
}
