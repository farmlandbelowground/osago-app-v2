'use server'

import { legacyApiFetch } from '@shared/api/legacyApiFetch'

import {
  ADMIN_RESET_FEE,
  ADMIN_RESET_PAYMENT_TERM_DAYS,
  SALES_INVOICE_CREATE_ENDPOINT,
} from './constants'
import { AdminResetInvoiceResponseSchema } from './schema'
import { type CreateInvoiceResult } from './types'

// Ports legacy _createAdminResetInvoice (osago-bundle.js:12626-12644): a manual
// Mollie sales invoice for the €199 reset fee. Note: /api/mollie/sales-invoice/
// create's `mode:'manual'` is admin-only, but this always runs under the
// impersonated CUSTOMER's session (the reset buttons only render while
// impersonating), so the endpoint rejects it exactly as it did in legacy — the
// reset itself still stands; only the invoice fails softly. Flagged, not fixed,
// per the replicate-legacy-exactly directive.
export const createAdminResetInvoice = async (
  targetUserId: string,
  lineDescription: string,
): Promise<CreateInvoiceResult> => {
  const result = await legacyApiFetch(SALES_INVOICE_CREATE_ENDPOINT, {
    body: JSON.stringify({
      description: lineDescription,
      lineItems: [{ description: lineDescription, netAmount: ADMIN_RESET_FEE }],
      mode: 'manual',
      paymentTermDays: ADMIN_RESET_PAYMENT_TERM_DAYS,
      status: 'issued',
      targetUserId,
    }),
    method: 'POST',
    schema: AdminResetInvoiceResponseSchema,
  })

  return { error: result.error }
}
