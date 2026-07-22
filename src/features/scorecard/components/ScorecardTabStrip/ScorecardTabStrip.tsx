'use client'

import { type FC } from 'react'

import { type Props } from './types'

// Legacy styles .sc-tab entirely inline (no CSS rule exists) — reproduced here.
export const ScorecardTabStrip: FC<Props> = ({
  activeTabId,
  onSelect,
  tabs,
}) => {
  return (
    <div
      className="card mb-4"
      style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: 8 }}
    >
      {tabs.map(tab => {
        const isActive = tab.id === activeTabId

        return (
          <button
            className="sc-tab"
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            style={{
              alignItems: 'center',
              background: isActive ? 'var(--green-soft)' : '#fff',
              border: `1px solid ${isActive ? 'var(--green)' : 'var(--line)'}`,
              borderRadius: 99,
              color: isActive ? 'var(--green-dark)' : 'var(--ink)',
              cursor: 'pointer',
              display: 'inline-flex',
              fontSize: 13,
              fontWeight: isActive ? '600' : '500',
              gap: 8,
              padding: '8px 14px',
            }}
            type="button"
          >
            <span>{tab.label}</span>
            <span
              style={{
                background: isActive ? 'var(--green-dark)' : 'var(--line-soft)',
                borderRadius: 99,
                color: isActive ? '#fff' : 'var(--muted)',
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 7px',
              }}
            >
              {tab.answered} / {tab.total}
            </span>
          </button>
        )
      })}
    </div>
  )
}
