import { type Invoice } from '@features/subscriptions/types'

// Per-customer billed revenue (osago-bundle.js:24138): sum of non-draft,
// non-cancelled invoice gross values. Legacy matched on invoice.userId; v2's
// normalized invoice has no userId, so we attribute by recipientEmail.
export const buildRevenueByEmail = (
  invoices: Invoice[],
): Map<string, number> => {
  const byEmail = new Map<string, number>()

  for (const invoice of invoices) {
    if (invoice.status === 'draft' || invoice.status === 'cancelled') {
      continue
    }

    const key = invoice.recipientEmail.toLowerCase()
    byEmail.set(key, (byEmail.get(key) ?? 0) + (invoice.grossValue ?? 0))
  }

  return byEmail
}
