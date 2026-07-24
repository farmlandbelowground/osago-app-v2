import { EURO_MILLION_THRESHOLD, MONEY_DECIMALS } from '../constants'

// Ports legacy fmtMoney (osago-bundle.js:3159): no cents, nl-NL grouping, and
// values ≥ €1M collapse to "€X mln" instead of the full amount.
export const formatMoney = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—'
  }

  if (value >= EURO_MILLION_THRESHOLD) {
    return `€${(value / EURO_MILLION_THRESHOLD)
      .toFixed(MONEY_DECIMALS)
      .replace(/\.?0+$/, '')} mln`
  }

  return `€${value.toLocaleString('nl-NL')}`
}
