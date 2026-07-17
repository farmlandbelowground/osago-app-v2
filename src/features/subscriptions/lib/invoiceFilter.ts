import {
  END_OF_DAY_HOURS,
  END_OF_DAY_MINUTES,
  END_OF_DAY_MS,
  END_OF_DAY_SECONDS,
  INVOICE_FILTER_PRESET_LABELS,
  LAST_DAY_OF_DECEMBER,
  LAST_MONTH_INDEX,
  MONTHS_PER_QUARTER,
} from '../constants'
import { type Invoice, type InvoiceFilter } from '../types'
import { formatDateNl } from './formatDateNl'

interface DateRange {
  from: number | null
  to: number | null
}

const startOfDay = (dateString: string): number => {
  const date = new Date(dateString)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

const endOfDay = (dateString: string): number => {
  const date = new Date(dateString)
  date.setHours(
    END_OF_DAY_HOURS,
    END_OF_DAY_MINUTES,
    END_OF_DAY_SECONDS,
    END_OF_DAY_MS,
  )
  return date.getTime()
}

const monthRange = (year: number, monthIndex: number): DateRange => ({
  from: new Date(year, monthIndex, 1).getTime(),
  to: endOfDay(new Date(year, monthIndex + 1, 0).toISOString()),
})

// Ports legacy's resolveInvoiceFilterRange() (osago-bundle.js:25390)
// verbatim as typed logic — presets are computed against *today*, not a
// stored range. `new Date(year, month, 0)` is the JS "day zero" rollover
// trick for the last day of the previous month.
export const resolveInvoiceFilterRange = (filter: InvoiceFilter): DateRange => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  if (filter.preset === 'month') {
    return monthRange(year, month)
  }

  if (filter.preset === 'quarter') {
    const quarterStartMonth =
      Math.floor(month / MONTHS_PER_QUARTER) * MONTHS_PER_QUARTER

    return {
      from: new Date(year, quarterStartMonth, 1).getTime(),
      to: endOfDay(
        new Date(year, quarterStartMonth + MONTHS_PER_QUARTER, 0).toISOString(),
      ),
    }
  }

  if (filter.preset === 'year') {
    return {
      from: new Date(year, 0, 1).getTime(),
      to: endOfDay(
        new Date(year, LAST_MONTH_INDEX, LAST_DAY_OF_DECEMBER).toISOString(),
      ),
    }
  }

  if (filter.preset === 'custom') {
    return {
      from: filter.from ? startOfDay(filter.from) : null,
      to: filter.to ? endOfDay(filter.to) : null,
    }
  }

  return { from: null, to: null }
}

// Ports legacy's date-range filter over the cached invoice list
// (osago-bundle.js:25277-25284) — used both by AdminInvoicesTable's
// client-side re-slice and the export Route Handler's server-side re-filter.
export const filterInvoicesByDateRange = (
  invoices: Invoice[],
  filter: InvoiceFilter,
): Invoice[] => {
  const range = resolveInvoiceFilterRange(filter)

  return invoices.filter(invoice => {
    const referenceDate = invoice.issuedAt ?? invoice.createdAt

    if (!referenceDate) {
      return filter.preset === 'all'
    }

    const timestamp = new Date(referenceDate).getTime()

    if (range.from !== null && timestamp < range.from) {
      return false
    }

    if (range.to !== null && timestamp > range.to) {
      return false
    }

    return true
  })
}

export const describeInvoiceFilter = (filter: InvoiceFilter): string => {
  if (filter.preset === 'custom') {
    if (!filter.from && !filter.to) {
      return INVOICE_FILTER_PRESET_LABELS.custom
    }

    const from = filter.from ? formatDateNl(filter.from) : '…'
    const to = filter.to ? formatDateNl(filter.to) : '…'

    return `${INVOICE_FILTER_PRESET_LABELS.custom} · ${from} t/m ${to}`
  }

  return INVOICE_FILTER_PRESET_LABELS[filter.preset]
}
