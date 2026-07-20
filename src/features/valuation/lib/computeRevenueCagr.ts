export const computeRevenueCagr = (
  historicalYearsOldestFirst: Array<{ year: number; revenue: number }>,
): number | null => {
  if (historicalYearsOldestFirst.length < 2) {
    return null
  }

  const first = historicalYearsOldestFirst[0]
  const last = historicalYearsOldestFirst[historicalYearsOldestFirst.length - 1]

  const span = last.year - first.year
  if (span <= 0) {
    return null
  }

  if (first.revenue <= 0) {
    const yoy: number[] = []
    for (let i = 1; i < historicalYearsOldestFirst.length; i++) {
      const prev = historicalYearsOldestFirst[i - 1].revenue
      const curr = historicalYearsOldestFirst[i].revenue
      if (prev !== 0) {
        yoy.push((curr - prev) / Math.abs(prev))
      }
    }
    return yoy.length > 0 ? yoy.reduce((a, b) => a + b, 0) / yoy.length : null
  }

  return Math.pow(last.revenue / first.revenue, 1 / span) - 1
}
