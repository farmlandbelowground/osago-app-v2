export type AdminResetType =
  | 'anoniem'
  | 'memorandum'
  | 'valuation'
  | 'valuationPdf'
  | 'verbeterrapport'

export interface AdminResetConfigEntry {
  invoiceLine: string
  message: string
  successToast: string
  title: string
}

export type CreateInvoiceResult = { error: string | null }

// A reset always "succeeds" (legacy swallows apply errors); the only reportable
// outcome is whether the optional €199 invoice failed.
export type AdminResetResult = { invoiceError: string | null }

export type AdminResetAction = (
  withInvoice: boolean,
) => Promise<AdminResetResult>
