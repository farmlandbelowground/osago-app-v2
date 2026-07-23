export type AdminResetType =
  'anoniem' | 'memorandum' | 'valuation' | 'valuationPdf' | 'verbeterrapport'

export interface AdminResetConfigEntry {
  invoiceLine: string
  message: string
  successToast: string
  title: string
}

export type CreateInvoiceResult = { error: string | null }

// A reset always "succeeds" (legacy swallows apply errors). Reportable outcomes:
// whether the optional €199 invoice failed, and — for document resets — whether
// nothing matched (then no email is sent and nothing is charged; #65 no-op guard).
export type AdminResetResult = {
  invoiceError: string | null
  nothingRemoved?: boolean
}

export type AdminResetAction = (
  withInvoice: boolean,
) => Promise<AdminResetResult>
