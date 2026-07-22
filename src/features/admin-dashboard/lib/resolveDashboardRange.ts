import {
  END_OF_DAY_HOURS,
  END_OF_DAY_MINUTES,
  END_OF_DAY_MS,
  END_OF_DAY_SECONDS,
  LAST_DAY_OF_DECEMBER,
  LAST_MONTH_INDEX,
  QUARTER_MONTHS,
} from '../constants'
import { type DashboardFilter, type DashboardRange } from '../types'

const dateStringToTs = (value: string, isEndOfDay: boolean): number | null => {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  if (isEndOfDay) {
    date.setHours(
      END_OF_DAY_HOURS,
      END_OF_DAY_MINUTES,
      END_OF_DAY_SECONDS,
      END_OF_DAY_MS,
    )
  } else {
    date.setHours(0, 0, 0, 0)
  }

  return date.getTime()
}

// Ports resolveInvoiceFilterRange (osago-bundle.js:25386). Presets are computed
// against the current date so "Deze maand" always reflects today.
export const resolveDashboardRange = (
  filter: DashboardFilter,
): DashboardRange => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  if (filter.preset === 'month') {
    return {
      from: new Date(year, month, 1, 0, 0, 0, 0).getTime(),
      to: new Date(
        year,
        month + 1,
        0,
        END_OF_DAY_HOURS,
        END_OF_DAY_MINUTES,
        END_OF_DAY_SECONDS,
        END_OF_DAY_MS,
      ).getTime(),
    }
  }

  if (filter.preset === 'quarter') {
    const quarterStart = Math.floor(month / QUARTER_MONTHS) * QUARTER_MONTHS

    return {
      from: new Date(year, quarterStart, 1, 0, 0, 0, 0).getTime(),
      to: new Date(
        year,
        quarterStart + QUARTER_MONTHS,
        0,
        END_OF_DAY_HOURS,
        END_OF_DAY_MINUTES,
        END_OF_DAY_SECONDS,
        END_OF_DAY_MS,
      ).getTime(),
    }
  }

  if (filter.preset === 'year') {
    return {
      from: new Date(year, 0, 1, 0, 0, 0, 0).getTime(),
      to: new Date(
        year,
        LAST_MONTH_INDEX,
        LAST_DAY_OF_DECEMBER,
        END_OF_DAY_HOURS,
        END_OF_DAY_MINUTES,
        END_OF_DAY_SECONDS,
        END_OF_DAY_MS,
      ).getTime(),
    }
  }

  if (filter.preset === 'custom') {
    return {
      from: filter.from ? dateStringToTs(filter.from, false) : null,
      to: filter.to ? dateStringToTs(filter.to, true) : null,
    }
  }

  return { from: null, to: null }
}
