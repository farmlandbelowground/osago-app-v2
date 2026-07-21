// Ports legacy's fmtDate (osago-bundle.js:3151-3154): nl-NL day / short-month / year.
export const formatLeadDate = (isoDate: string | null): string => {
  if (!isoDate) {
    return '—'
  }
  return new Date(isoDate).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
