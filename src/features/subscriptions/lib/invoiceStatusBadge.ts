import { type Invoice } from '../schema'
import { type BadgeKind } from '../types'
import { isOverdueInvoice } from './lockStatus'

export interface InvoiceStatusBadge {
  kind: BadgeKind
  label: string
}

// Ports legacy's mollieInvoiceStatusBadge() (osago-bundle.js:11970) verbatim
// as typed logic.
export const invoiceStatusBadge = (invoice: Invoice): InvoiceStatusBadge => {
  if (invoice.isCreditNote || invoice.status === 'paid') {
    return { kind: 'success', label: 'Betaald' }
  }

  if (invoice.status === 'cancelled') {
    return { kind: 'neutral', label: 'Geannuleerd' }
  }

  if (invoice.status === 'draft') {
    return { kind: 'neutral', label: 'Concept' }
  }

  if (invoice.status === 'issued') {
    return isOverdueInvoice(invoice)
      ? { kind: 'danger', label: 'Vervallen' }
      : { kind: 'warning', label: 'Open' }
  }

  return { kind: 'neutral', label: invoice.status }
}
