export const formatCustomerDate = (iso: string | null): string => {
  if (!iso) {
    return '—'
  }

  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
