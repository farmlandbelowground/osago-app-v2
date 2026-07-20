import { type Normalization } from '../types'

export const computeNormalizationsForYear = (
  normalizations: Normalization[],
  year: number,
): number => {
  let sum = 0
  for (const normalization of normalizations) {
    if (normalization.amount === 0) {
      continue
    }
    // A missing/null `years` list means "applies to every year" — legacy
    // backwards-compat for normalizations saved before that field existed.
    if (normalization.years === null || normalization.years.includes(year)) {
      sum += normalization.amount
    }
  }
  return Math.round(sum)
}
