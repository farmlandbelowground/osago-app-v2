import {
  DASHBOARD_PRESET_LABELS,
  EURO_MILLION_THRESHOLD,
  MONEY_DECIMALS,
} from '../constants'
import { type DashboardFilter, type DashboardRange } from '../types'

// Ports legacy fmtMoney (osago-bundle.js:3145): no cents, nl-NL grouping, values
// ≥ €1M render as "€X mln". v2 grossValue may carry cents (Mollie), so the
// non-mln branch rounds to whole euros to keep legacy's cent-free look.
export const formatDashboardMoney = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '—'
  }

  if (value >= EURO_MILLION_THRESHOLD) {
    return `€${(value / EURO_MILLION_THRESHOLD)
      .toFixed(MONEY_DECIMALS)
      .replace(/\.?0+$/, '')} mln`
  }

  return `€${Math.round(value).toLocaleString('nl-NL')}`
}

// Ports legacy fmtDate (osago-bundle.js:3151).
export const formatDashboardDate = (ms: number | null): string => {
  if (ms === null) {
    return '—'
  }

  return new Date(ms).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Ports describeDashFilterRange (osago-bundle.js:23868) — the right-aligned
// "Deze maand · 1 jul. 2026 t/m 31 jul. 2026" hint shown when a filter is set.
export const describeDashboardRange = (
  filter: DashboardFilter,
  range: DashboardRange,
): string => {
  const label = DASHBOARD_PRESET_LABELS[filter.preset]

  if (range.from !== null && range.to !== null) {
    return `${label} · ${formatDashboardDate(range.from)} t/m ${formatDashboardDate(range.to)}`
  }
  if (range.from !== null) {
    return `${label} · vanaf ${formatDashboardDate(range.from)}`
  }
  if (range.to !== null) {
    return `${label} · t/m ${formatDashboardDate(range.to)}`
  }

  return label
}
