// Ports fmtTabularEuro (osago-bundle.js:8845) — the slider-label formatter.
export const formatValuationEuro = (
  value: number | null | undefined,
): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '—'
  }
  return `€ ${value.toLocaleString('nl-NL', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })}`
}

// Ports dcfFmtEur (osago-bundle.js:6253) — the DCF totals formatter, which
// differs by placing the minus sign before the euro symbol.
export const formatDcfEuro = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !isFinite(value)) {
    return '—'
  }
  const sign = value < 0 ? '-' : ''
  return `${sign}€ ${Math.abs(Math.round(value)).toLocaleString('nl-NL')}`
}
