import { type Invoice } from '../schema'
import { type LockReason, type Subscription } from '../types'
import { subStatus } from './subStatus'

export const isOverdueInvoice = (invoice: Invoice): boolean =>
  invoice.status === 'issued' &&
  !invoice.isCreditNote &&
  invoice.dueAt !== null &&
  new Date(invoice.dueAt).getTime() < Date.now()

// Ports legacy's customerLockReason() (osago-bundle.js:11631) verbatim as
// typed logic. An impersonating admin's session bypasses this check
// entirely — that read of session.impersonatedBy happens upstream of this
// call, not inside this pure function (see slice-03 spec §2.1).
export const lockStatus = (
  subscription: Subscription | null,
  invoices: Invoice[],
): LockReason => {
  if (invoices.some(isOverdueInvoice)) {
    return 'overdue'
  }

  if (subStatus(subscription).status === 'expired') {
    return 'expired'
  }

  return null
}
