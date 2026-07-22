import { z } from 'zod'

// The create endpoint returns a normalized invoice object on success. The reset
// flow only needs to know whether it succeeded, so the shape is accepted loosely.
export const AdminResetInvoiceResponseSchema = z.unknown()
