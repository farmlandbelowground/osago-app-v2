// Ports legacy's fmtDate (osago-bundle.js:3151-3154): nl-NL day / short-month / year.
export const formatDocumentDate = (isoDate: string): string =>
  new Date(isoDate).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
