const HISTORICAL_YEAR_COUNT = 3
const FORECAST_YEAR_COUNT_MIN = 3

export interface DisplayYears {
  forecastYears: number[]
  historicalYears: number[]
  restYear: number | null
}

export const computeDisplayYears = (
  lastClosedYear: number,
  scenarioYearCount: number,
  dcfApplyEnabled: boolean,
): DisplayYears => {
  const historicalYears = Array.from(
    { length: HISTORICAL_YEAR_COUNT },
    (_, index) => lastClosedYear - (HISTORICAL_YEAR_COUNT - 1 - index),
  )

  const forecastYearCount = Math.max(FORECAST_YEAR_COUNT_MIN, scenarioYearCount)
  const forecastYears = Array.from(
    { length: forecastYearCount },
    (_, index) => lastClosedYear + 1 + index,
  )

  const restYear = dcfApplyEnabled
    ? lastClosedYear + 1 + forecastYearCount
    : null

  return { historicalYears, forecastYears, restYear }
}
