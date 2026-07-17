import { z } from 'zod'

import {
  PLAN_IDS,
  VOUCHER_APPLIES_TO_ALL,
  VOUCHER_PERCENTAGE_MAX,
} from './constants'

// ─── /api/mollie/* response contracts (frozen backend — see migration-plan.md §1.1) ───

export const CreatePaymentResponseSchema = z.object({
  checkoutUrl: z.url(),
  paymentId: z.string(),
})

export const SubscriptionReturnResultSchema = z.object({
  activated: z.boolean(),
  activationKind: z.string().optional(),
  error: z.string().optional(),
  invoiceCreated: z.boolean().optional(),
  kind: z.string().optional(),
  paymentId: z.string(),
  reason: z.string().optional(),
})

export const SubscriptionReturnResponseSchema = z.object({
  activated: z.number(),
  checked: z.number(),
  results: z.array(SubscriptionReturnResultSchema),
})

export type SubscriptionReturnResponse = z.infer<
  typeof SubscriptionReturnResponseSchema
>

export const ReconcileSalesInvoicesResponseSchema = z.object({
  activated: z.number(),
  checked: z.number(),
})

export const NormalizedInvoiceSchema = z.object({
  createdAt: z.iso.datetime({ offset: true }).nullable(),
  currency: z.string(),
  description: z.string(),
  dueAt: z.iso.datetime({ offset: true }).nullable(),
  grossValue: z.number().nullable(),
  id: z.string(),
  isCreditNote: z.boolean(),
  issuedAt: z.iso.datetime({ offset: true }).nullable(),
  number: z.string(),
  paidAt: z.iso.datetime({ offset: true }).nullable(),
  paymentTerm: z.string().nullable(),
  paymentUrl: z.url().nullable(),
  pdfUrl: z.url().nullable(),
  period: z.string(),
  recipientEmail: z.email(),
  recipientIdentifier: z.string().nullable(),
  recipientName: z.string().nullable(),
  status: z.enum(['draft', 'issued', 'paid', 'cancelled']),
})

export type Invoice = z.infer<typeof NormalizedInvoiceSchema>

export const SalesInvoiceListResponseSchema = z.object({
  invoices: z.array(NormalizedInvoiceSchema),
})

// ─── Supabase `subscriptions` — direct read/write (not /api/*) ───

export const SubscriptionRowSchema = z.object({
  auto_renew: z.boolean(),
  created_at: z.iso.datetime({ offset: true }),
  end_date: z.string().nullable(),
  history: z.array(z.unknown()),
  list_price: z.number().nullable(),
  price: z.number().nullable(),
  start_date: z.string().nullable(),
  type: z.string().nullable(),
  updated_at: z.iso.datetime({ offset: true }),
  user_id: z.uuid(),
  voucher_code: z.string().nullable(),
  voucher_id: z.uuid().nullable(),
})

export type SubscriptionRow = z.infer<typeof SubscriptionRowSchema>

// ─── Supabase `vouchers` — direct read/write (not /api/*) ───

export const VoucherRowSchema = z.object({
  active: z.boolean(),
  applies_to: z.string(),
  code: z.string(),
  created_at: z.iso.datetime({ offset: true }),
  created_by: z.uuid().nullable(),
  description: z.string().nullable(),
  id: z.string(),
  max_uses: z.number().int().nullable(),
  type: z.enum(['percentage', 'fixed']),
  updated_at: z.iso.datetime({ offset: true }),
  used_count: z.number().int(),
  valid_from: z.iso.datetime({ offset: true }).nullable(),
  valid_until: z.iso.datetime({ offset: true }).nullable(),
  value: z.number(),
})

export type VoucherRow = z.infer<typeof VoucherRowSchema>

// ─── Server Action input schemas — client + server validation ───

export const CreateSubscriptionPaymentSchema = z.object({
  planId: z.enum(PLAN_IDS, { error: 'Selecteer een abonnement.' }),
  voucherCode: z.string().optional(),
})

export type CreateSubscriptionPaymentInput = z.infer<
  typeof CreateSubscriptionPaymentSchema
>

export const ValidateVoucherCodeSchema = z.object({
  code: z.string().min(1, 'Vul een vouchercode in.'),
  planId: z.enum(PLAN_IDS, { error: 'Selecteer een abonnement.' }),
})

export const ToggleAutoRenewSchema = z.object({
  autoRenew: z.boolean(),
})

export const AdminSubscriptionFormSchema = z.object({
  autoRenew: z.boolean(),
  endDate: z.string().min(1, 'Vul een einddatum in.'),
  planId: z.enum(PLAN_IDS, { error: 'Selecteer een abonnementstype.' }),
  price: z.number().gt(0, 'Vul een prijs groter dan 0 in.'),
  startDate: z.string().min(1, 'Vul een startdatum in.'),
  userId: z.uuid('Selecteer een klant.'),
})

export type AdminSubscriptionFormInput = z.infer<
  typeof AdminSubscriptionFormSchema
>

export const AdminCancelSubscriptionSchema = z.object({
  userId: z.uuid(),
})

export const AppliesToSchema = z.enum([...PLAN_IDS, VOUCHER_APPLIES_TO_ALL])

export const AdminVoucherFormSchema = z
  .object({
    active: z.boolean(),
    appliesTo: AppliesToSchema,
    code: z
      .string()
      .min(1, 'Vul een code in.')
      .transform(value => value.trim().toUpperCase().replace(/\s+/g, '')),
    description: z.string().optional(),
    id: z.string().optional(),
    maxUses: z.number().int().positive().optional(),
    type: z.enum(['percentage', 'fixed']),
    validFrom: z.string().optional(),
    validUntil: z.string().optional(),
    value: z.number().gt(0, 'Vul een waarde groter dan 0 in.'),
  })
  .refine(data => /^[A-Z0-9]+$/.test(data.code), {
    error: 'Hoofdletters en cijfers, geen spaties.',
    path: ['code'],
  })
  .refine(
    data => data.type !== 'percentage' || data.value <= VOUCHER_PERCENTAGE_MAX,
    {
      error: 'Percentage mag niet hoger zijn dan 100.',
      path: ['value'],
    },
  )
  .refine(
    data =>
      !data.validFrom || !data.validUntil || data.validUntil >= data.validFrom,
    { error: 'Einddatum moet na de startdatum liggen.', path: ['validUntil'] },
  )

export type AdminVoucherFormInput = z.infer<typeof AdminVoucherFormSchema>

export const DeleteVoucherSchema = z.object({
  id: z.string().min(1),
})

export const AdminManualInvoiceLineItemFormSchema = z.object({
  description: z.string().min(1, 'Vul een omschrijving in.'),
  netAmount: z.number().min(0, 'Bedrag mag niet negatief zijn.'),
})

export const AdminManualInvoiceFormSchema = z.object({
  description: z.string().min(1, 'Vul een omschrijving in.'),
  lineItems: z
    .array(AdminManualInvoiceLineItemFormSchema)
    .min(1, 'Voeg minimaal 1 factuurregel toe.'),
  paymentTermDays: z.number().int().positive(),
  status: z.enum(['draft', 'issued']),
  targetUserId: z.uuid('Selecteer een klant.'),
})

export type AdminManualInvoiceFormInput = z.infer<
  typeof AdminManualInvoiceFormSchema
>

export const AdminDeleteInvoiceSchema = z.object({
  id: z.string().regex(/^si_/, 'Ongeldig factuur-id.'),
})

export const DeleteInvoiceResponseSchema = z.object({
  ok: z.literal(true),
})
