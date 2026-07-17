export const formatDateNl = (isoDate: string): string =>
  new Date(isoDate).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
