import { type NextRequest } from 'next/server'

import {
  XLS_FILENAME_PREFIX,
  XLS_MIME_TYPE,
} from '@features/subscriptions/constants'
import { exactOnlineXlsWriter } from '@features/subscriptions/lib/exactOnlineXlsWriter'
import { filterInvoicesByDateRange } from '@features/subscriptions/lib/invoiceFilter'
import { adminListInvoices } from '@features/subscriptions/queries'
import {
  type InvoiceFilter,
  type InvoiceFilterPreset,
} from '@features/subscriptions/types'
import { requireRole } from '@shared/auth/guards'

const DATE_ONLY_LENGTH = 10

const isFilterPreset = (value: string | null): value is InvoiceFilterPreset =>
  value === 'all' ||
  value === 'month' ||
  value === 'quarter' ||
  value === 'year' ||
  value === 'custom'

export const GET = async (request: NextRequest): Promise<Response> => {
  await requireRole('admin_user')

  const presetParam = request.nextUrl.searchParams.get('preset')
  const filter: InvoiceFilter = {
    from: request.nextUrl.searchParams.get('from'),
    preset: isFilterPreset(presetParam) ? presetParam : 'all',
    to: request.nextUrl.searchParams.get('to'),
  }

  const invoices = await adminListInvoices()
  const filteredInvoices = filterInvoicesByDateRange(invoices, filter)
  const buffer = exactOnlineXlsWriter(filteredInvoices)
  const today = new Date().toISOString().slice(0, DATE_ONLY_LENGTH)

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Disposition': `attachment; filename="${XLS_FILENAME_PREFIX}${today}.xls"`,
      'Content-Type': XLS_MIME_TYPE,
    },
  })
}
