import { CENTS_PER_UNIT } from '../constants'

// Drops trailing ",00" for whole-euro amounts (e.g. "€ 1.799" instead of
// "€ 1.799,00") while still showing cents when the amount actually has them.
export const formatEuro = (value: number): string => {
  const rounded = Math.round(value * CENTS_PER_UNIT) / CENTS_PER_UNIT
  const hasCents = rounded % 1 !== 0

  return new Intl.NumberFormat('nl-NL', {
    currency: 'EUR',
    maximumFractionDigits: 2,
    minimumFractionDigits: hasCents ? 2 : 0,
    style: 'currency',
  }).format(rounded)
}
