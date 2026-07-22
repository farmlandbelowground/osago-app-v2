'use client'

import { useRouter } from 'next/navigation'
import { type FC } from 'react'

import { cn } from '@shared/utils/cn'

import {
  ADMIN_DASHBOARD_PATH,
  DASHBOARD_PRESET_LABELS,
  DASHBOARD_PRESETS,
} from '../../constants'
import { type DashboardPreset } from '../../types'
import { type Props } from './types'

// URL-driven filter (?preset=/?from=/?to=) so the page stays an RSC and
// re-reads on navigation — ports the _dashFilter state + setters
// (osago-bundle.js:23849-23882).
export const AdminDashboardPeriodFilter: FC<Props> = ({
  filter,
  rangeLabel,
}) => {
  const router = useRouter()

  const setPreset = (preset: DashboardPreset): void => {
    if (preset === 'all') {
      router.push(ADMIN_DASHBOARD_PATH)
      return
    }
    router.push(`${ADMIN_DASHBOARD_PATH}?preset=${preset}`)
  }

  const setCustomDate = (field: 'from' | 'to', value: string): void => {
    const params = new URLSearchParams()
    params.set('preset', 'custom')

    const from = field === 'from' ? value : filter.from
    const to = field === 'to' ? value : filter.to

    if (from) {
      params.set('from', from)
    }
    if (to) {
      params.set('to', to)
    }

    router.push(`${ADMIN_DASHBOARD_PATH}?${params.toString()}`)
  }

  const isFiltered = filter.preset !== 'all'

  return (
    <div className="card mb-4" style={{ padding: '14px 18px' }}>
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div
          style={{ alignItems: 'center', display: 'flex', flexShrink: 0, gap: 8 }}
        >
          <svg
            fill="none"
            height="14"
            stroke="currentColor"
            strokeWidth="2"
            style={{ color: 'var(--muted)' }}
            viewBox="0 0 24 24"
            width="14"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span className="text-sm fw-600">Filter op periode</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {DASHBOARD_PRESETS.map(preset => (
            <button
              className={cn('filter-chip', filter.preset === preset && 'active')}
              key={preset}
              onClick={() => setPreset(preset)}
              type="button"
            >
              {DASHBOARD_PRESET_LABELS[preset]}
            </button>
          ))}
        </div>
        {filter.preset === 'custom' && (
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <input
              onChange={event => setCustomDate('from', event.target.value)}
              style={{ fontSize: 13, padding: '6px 10px', width: 'auto' }}
              type="date"
              value={filter.from ?? ''}
            />
            <span className="text-muted text-sm">t/m</span>
            <input
              onChange={event => setCustomDate('to', event.target.value)}
              style={{ fontSize: 13, padding: '6px 10px', width: 'auto' }}
              type="date"
              value={filter.to ?? ''}
            />
          </div>
        )}
        <div style={{ flex: 1 }} />
        {isFiltered && (
          <>
            <span className="text-xs text-muted" style={{ whiteSpace: 'nowrap' }}>
              {rangeLabel}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => router.push(ADMIN_DASHBOARD_PATH)}
              style={{ padding: '4px 10px' }}
              type="button"
            >
              Wissen
            </button>
          </>
        )}
      </div>
    </div>
  )
}
