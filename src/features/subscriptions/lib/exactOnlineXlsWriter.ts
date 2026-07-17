import * as XLSX from 'xlsx'

import {
  CENTS_PER_UNIT,
  VAT_PERCENTAGE,
  VAT_RATE,
  XLS_BETALINGSCONDITIE_CODE,
  XLS_BTW_CODE,
  XLS_DAGBOEK_CODE,
  XLS_GROOTBOEKREKENING_CODE,
  XLS_HEADERS,
  XLS_QUANTITY,
  XLS_SHEET_NAME,
} from '../constants'
import { type Invoice } from '../types'

const roundToCents = (value: number): number =>
  Math.round(value * CENTS_PER_UNIT) / CENTS_PER_UNIT

const formatMoneyNl = (value: number): string =>
  roundToCents(value).toFixed(2).replace('.', ',')

// Exact Online expects dd-mm-yyyy — distinct from the UI's "29 jun 2026"
// display format, so this doesn't reuse formatDateNl.
const formatDateNlNumeric = (isoDate: string): string => {
  const date = new Date(isoDate)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')

  return `${day}-${month}-${date.getFullYear()}`
}

const textCell = (value: string): XLSX.CellObject => ({ t: 's', v: value })

const buildRow = (invoice: Invoice): unknown[] => {
  const issued = invoice.issuedAt ? new Date(invoice.issuedAt) : null
  const gross = invoice.grossValue ?? 0
  const netTotal = roundToCents(gross / (1 + VAT_RATE))
  const btwAmount = roundToCents(gross - netTotal)
  const description = invoice.description || invoice.period || ''

  return [
    XLS_DAGBOEK_CODE,
    issued ? issued.getFullYear() : '',
    issued ? issued.getMonth() + 1 : '',
    textCell(invoice.number),
    textCell(description),
    textCell(invoice.issuedAt ? formatDateNlNumeric(invoice.issuedAt) : ''),
    textCell(invoice.dueAt ? formatDateNlNumeric(invoice.dueAt) : ''),
    XLS_BETALINGSCONDITIE_CODE,
    textCell(invoice.number),
    textCell(invoice.recipientIdentifier ?? ''),
    textCell(invoice.recipientName ?? ''),
    XLS_GROOTBOEKREKENING_CODE,
    textCell(description),
    XLS_BTW_CODE,
    VAT_PERCENTAGE,
    textCell(formatMoneyNl(netTotal)),
    XLS_QUANTITY,
    textCell(formatMoneyNl(btwAmount)),
  ]
}

// Ports legacy's exportInvoicesToExcel() (osago-bundle.js:25266) — legacy
// delegates the BIFF8 binary encoding to the SheetJS `xlsx` library rather
// than hand-rolling it, so this server-side port reuses the same library to
// guarantee byte-for-byte parity with legacy's actual output.
export const exactOnlineXlsWriter = (invoices: Invoice[]): Buffer => {
  const rows = [[...XLS_HEADERS], ...invoices.map(buildRow)]
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(rows)

  XLSX.utils.book_append_sheet(workbook, worksheet, XLS_SHEET_NAME)

  return XLSX.write(workbook, { bookType: 'biff8', type: 'buffer' }) as Buffer
}
