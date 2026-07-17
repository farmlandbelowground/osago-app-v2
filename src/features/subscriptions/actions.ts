'use server'

import { revalidatePath } from 'next/cache'

import { legacyApiFetch } from '@shared/api/legacyApiFetch'
import { requireRole } from '@shared/auth/guards'
import { requireSession } from '@shared/auth/session'
import { getServerClient } from '@shared/supabase/server'

import {
  ACCOUNT_PATH,
  ADMIN_ABONNEMENTEN_PATH,
  ADMIN_FACTUREN_PATH,
  ADMIN_VOUCHERS_PATH,
  DEFAULT_PAYMENT_TERM_DAYS,
  PLANS,
  SALES_INVOICE_CREATE_ENDPOINT,
  SALES_INVOICE_DELETE_ENDPOINT,
  SALES_INVOICE_RECONCILE_ENDPOINT,
  SUBSCRIPTION_CREATE_PAYMENT_ENDPOINT,
  SUBSCRIPTION_RETURN_ENDPOINT,
  VOUCHER_APPLIES_TO_ALL,
} from './constants'
import { formatDateNl } from './lib/formatDateNl'
import { voucherDiscount } from './lib/voucherDiscount'
import {
  AdminCancelSubscriptionSchema,
  AdminDeleteInvoiceSchema,
  AdminManualInvoiceFormSchema,
  AdminSubscriptionFormSchema,
  AdminVoucherFormSchema,
  CreatePaymentResponseSchema,
  CreateSubscriptionPaymentSchema,
  DeleteInvoiceResponseSchema,
  DeleteVoucherSchema,
  NormalizedInvoiceSchema,
  ReconcileSalesInvoicesResponseSchema,
  SubscriptionReturnResponseSchema,
  SubscriptionRowSchema,
  ToggleAutoRenewSchema,
  ValidateVoucherCodeSchema,
  VoucherRowSchema,
  type AdminManualInvoiceFormInput,
  type AdminSubscriptionFormInput,
  type AdminVoucherFormInput,
  type Invoice,
} from './schema'

type ActionResult = { error: null } | { error: string }

type CreateSubscriptionPaymentResult =
  | { checkoutUrl: string; error: null; paymentId: string }
  | { checkoutUrl: null; error: string; paymentId: null }

export const createSubscriptionPayment = async (
  planId: string,
  voucherCode?: string,
): Promise<CreateSubscriptionPaymentResult> => {
  const parsed = CreateSubscriptionPaymentSchema.safeParse({
    planId,
    voucherCode,
  })

  if (!parsed.success) {
    return {
      checkoutUrl: null,
      error: 'Selecteer een geldig abonnement.',
      paymentId: null,
    }
  }

  const result = await legacyApiFetch(SUBSCRIPTION_CREATE_PAYMENT_ENDPOINT, {
    body: JSON.stringify(parsed.data),
    method: 'POST',
    schema: CreatePaymentResponseSchema,
  })

  if (result.error !== null) {
    return {
      checkoutUrl: null,
      error: 'Aanmaken van de betaling is mislukt. Probeer het opnieuw.',
      paymentId: null,
    }
  }

  return {
    checkoutUrl: result.data.checkoutUrl,
    error: null,
    paymentId: result.data.paymentId,
  }
}

type ValidateVoucherCodeResult =
  | { discount: number; valid: true; voucherId: string }
  | { reason: string; valid: false }

export const validateVoucherCode = async (
  code: string,
  planId: string,
): Promise<ValidateVoucherCodeResult> => {
  const parsed = ValidateVoucherCodeSchema.safeParse({ code, planId })

  if (!parsed.success) {
    return { reason: 'Vul een geldige vouchercode in.', valid: false }
  }

  const plan = PLANS.find(candidate => candidate.id === parsed.data.planId)

  if (!plan) {
    return { reason: 'Onbekend abonnement.', valid: false }
  }

  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('vouchers')
    .select('*')
    .eq('code', parsed.data.code.trim().toUpperCase())
    .maybeSingle()

  if (error || !data) {
    return { reason: 'Vouchercode is niet geldig.', valid: false }
  }

  const result = VoucherRowSchema.safeParse(data)

  if (!result.success) {
    return { reason: 'Vouchercode is niet geldig.', valid: false }
  }

  const voucher = result.data

  if (!voucher.active) {
    return { reason: 'Deze vouchercode is gedeactiveerd.', valid: false }
  }

  const now = Date.now()

  if (voucher.valid_from && now < new Date(voucher.valid_from).getTime()) {
    return { reason: 'Deze vouchercode is nog niet geldig.', valid: false }
  }

  if (voucher.valid_until && now > new Date(voucher.valid_until).getTime()) {
    return { reason: 'Deze vouchercode is verlopen.', valid: false }
  }

  if (voucher.max_uses !== null && voucher.used_count >= voucher.max_uses) {
    return {
      reason: 'Deze vouchercode is niet meer beschikbaar.',
      valid: false,
    }
  }

  if (
    voucher.applies_to !== VOUCHER_APPLIES_TO_ALL &&
    voucher.applies_to !== plan.id
  ) {
    const targetPlan = PLANS.find(
      candidate => candidate.id === voucher.applies_to,
    )

    return {
      reason: `Deze vouchercode is alleen geldig voor het ${
        targetPlan?.label ?? voucher.applies_to
      }-abonnement.`,
      valid: false,
    }
  }

  const discount = voucherDiscount(
    { type: voucher.type, value: voucher.value },
    plan.price,
  )

  return { discount, valid: true, voucherId: voucher.id }
}

interface SubscriptionReturnOutcome {
  activated: number
  error: string | null
}

export const reconcileSubscriptionReturn =
  async (): Promise<SubscriptionReturnOutcome> => {
    const result = await legacyApiFetch(SUBSCRIPTION_RETURN_ENDPOINT, {
      body: JSON.stringify({}),
      method: 'POST',
      schema: SubscriptionReturnResponseSchema,
    })

    if (result.error !== null) {
      return { activated: 0, error: result.error }
    }

    return { activated: result.data.activated, error: null }
  }

export const reconcileSalesInvoiceActivations = async (): Promise<void> => {
  try {
    await legacyApiFetch(SALES_INVOICE_RECONCILE_ENDPOINT, {
      body: JSON.stringify({}),
      method: 'POST',
      schema: ReconcileSalesInvoicesResponseSchema,
    })
  } catch {
    // Best-effort fallback poll — must never break /account's render.
  }
}

export const toggleAutoRenew = async (
  autoRenew: boolean,
): Promise<ActionResult> => {
  const parsed = ToggleAutoRenewSchema.safeParse({ autoRenew })

  if (!parsed.success) {
    return { error: 'Ongeldige invoer.' }
  }

  const session = await requireSession()
  const supabase = await getServerClient()

  const { error } = await supabase
    .from('subscriptions')
    .update({ auto_renew: parsed.data.autoRenew })
    .eq('user_id', session.user.id)

  if (error) {
    return { error: 'Opslaan is mislukt. Probeer het opnieuw.' }
  }

  revalidatePath(ACCOUNT_PATH)
  return { error: null }
}

type AdminCreateInvoiceResult =
  { error: null; invoice: Invoice } | { error: string; invoice: null }

export const adminCreateInvoice = async (
  input: AdminManualInvoiceFormInput,
): Promise<AdminCreateInvoiceResult> => {
  const parsed = AdminManualInvoiceFormSchema.safeParse(input)

  if (!parsed.success) {
    return { error: 'Controleer de ingevulde gegevens.', invoice: null }
  }

  await requireRole('admin_user')

  const result = await legacyApiFetch(SALES_INVOICE_CREATE_ENDPOINT, {
    body: JSON.stringify({ ...parsed.data, mode: 'manual' }),
    method: 'POST',
    schema: NormalizedInvoiceSchema,
  })

  if (result.error !== null) {
    return { error: result.error, invoice: null }
  }

  revalidatePath(ADMIN_FACTUREN_PATH)
  return { error: null, invoice: result.data }
}

export const adminSaveSubscription = async (
  input: AdminSubscriptionFormInput,
): Promise<ActionResult> => {
  const parsed = AdminSubscriptionFormSchema.safeParse(input)

  if (!parsed.success) {
    return { error: 'Controleer de ingevulde gegevens.' }
  }

  await requireRole('admin_user')
  const supabase = await getServerClient()
  const { autoRenew, endDate, planId, price, startDate, userId } = parsed.data

  const { data: existingRow } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  const existing = existingRow
    ? SubscriptionRowSchema.safeParse(existingRow)
    : null
  const previous = existing?.success ? existing.data : null
  const isNewTerm = !previous || previous.start_date !== startDate

  const history = isNewTerm
    ? [
        ...(previous?.history ?? []),
        ...(previous
          ? [
              {
                auto_renew: previous.auto_renew,
                end_date: previous.end_date,
                list_price: previous.list_price,
                price: previous.price,
                start_date: previous.start_date,
                type: previous.type,
                voucher_code: previous.voucher_code,
                voucher_id: previous.voucher_id,
              },
            ]
          : []),
      ]
    : (previous?.history ?? [])

  const { error } = await supabase.from('subscriptions').upsert(
    {
      auto_renew: autoRenew,
      end_date: endDate,
      history,
      price,
      start_date: startDate,
      type: planId,
      user_id: userId,
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    return { error: 'Opslaan is mislukt. Probeer het opnieuw.' }
  }

  if (isNewTerm) {
    const plan = PLANS.find(candidate => candidate.id === planId)
    const invoiceResult = await adminCreateInvoice({
      description: `Osago ${plan?.label ?? planId} — abonnement ${formatDateNl(startDate)} t/m ${formatDateNl(endDate)}`,
      lineItems: [{ description: plan?.label ?? planId, netAmount: price }],
      paymentTermDays: DEFAULT_PAYMENT_TERM_DAYS,
      status: 'issued',
      targetUserId: userId,
    })

    if (invoiceResult.error) {
      revalidatePath(ADMIN_ABONNEMENTEN_PATH)
      return {
        error: `Abonnement opgeslagen, maar de factuur kon niet worden aangemaakt bij Mollie: ${invoiceResult.error}`,
      }
    }
  }

  revalidatePath(ADMIN_ABONNEMENTEN_PATH)
  return { error: null }
}

export const adminCancelSubscription = async (
  userId: string,
): Promise<ActionResult> => {
  const parsed = AdminCancelSubscriptionSchema.safeParse({ userId })

  if (!parsed.success) {
    return { error: 'Ongeldige klant.' }
  }

  await requireRole('admin_user')
  const supabase = await getServerClient()

  const { error } = await supabase
    .from('subscriptions')
    .update({ auto_renew: false })
    .eq('user_id', parsed.data.userId)

  if (error) {
    return { error: 'Beëindigen is mislukt. Probeer het opnieuw.' }
  }

  revalidatePath(ADMIN_ABONNEMENTEN_PATH)
  return { error: null }
}

export const adminDeleteInvoice = async (id: string): Promise<ActionResult> => {
  const parsed = AdminDeleteInvoiceSchema.safeParse({ id })

  if (!parsed.success) {
    return { error: 'Ongeldig factuur-id.' }
  }

  await requireRole('admin_user')

  const result = await legacyApiFetch(
    `${SALES_INVOICE_DELETE_ENDPOINT}?id=${encodeURIComponent(parsed.data.id)}`,
    { method: 'DELETE', schema: DeleteInvoiceResponseSchema },
  )

  if (result.error !== null) {
    return { error: result.error }
  }

  revalidatePath(ADMIN_FACTUREN_PATH)
  return { error: null }
}

export const saveVoucher = async (
  input: AdminVoucherFormInput,
): Promise<ActionResult> => {
  const parsed = AdminVoucherFormSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ?? 'Controleer de ingevulde gegevens.',
    }
  }

  const session = await requireRole('admin')
  const supabase = await getServerClient()
  const {
    active,
    appliesTo,
    code,
    description,
    id,
    maxUses,
    type,
    validFrom,
    validUntil,
    value,
  } = parsed.data

  if (!id) {
    const { data: existingCode } = await supabase
      .from('vouchers')
      .select('id')
      .eq('code', code)
      .maybeSingle()

    if (existingCode) {
      return { error: 'Deze code is al in gebruik.' }
    }
  }

  const payload = {
    active,
    applies_to: appliesTo,
    code,
    description: description || null,
    id: id ?? `vch_${crypto.randomUUID()}`,
    max_uses: maxUses ?? null,
    type,
    valid_from: validFrom || null,
    valid_until: validUntil ? `${validUntil}T23:59:59` : null,
    value,
    ...(id ? {} : { created_by: session.user.id, used_count: 0 }),
  }

  const { error } = await supabase.from('vouchers').upsert(payload)

  if (error) {
    return { error: 'Opslaan is mislukt. Probeer het opnieuw.' }
  }

  revalidatePath(ADMIN_VOUCHERS_PATH)
  return { error: null }
}

export const deleteVoucher = async (id: string): Promise<ActionResult> => {
  const parsed = DeleteVoucherSchema.safeParse({ id })

  if (!parsed.success) {
    return { error: 'Ongeldige vouchercode.' }
  }

  await requireRole('admin')
  const supabase = await getServerClient()

  const { error } = await supabase
    .from('vouchers')
    .delete()
    .eq('id', parsed.data.id)

  if (error) {
    return { error: 'Verwijderen is mislukt. Probeer het opnieuw.' }
  }

  revalidatePath(ADMIN_VOUCHERS_PATH)
  return { error: null }
}
