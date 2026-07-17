import { legacyApiFetch } from '@shared/api/legacyApiFetch'
import { getServerClient } from '@shared/supabase/server'

import {
  PLAN_IDS,
  SALES_INVOICE_LIST_ENDPOINT,
  VOUCHER_APPLIES_TO_ALL,
} from './constants'
import {
  SalesInvoiceListResponseSchema,
  SubscriptionRowSchema,
  VoucherRowSchema,
  type SubscriptionRow,
  type VoucherRow,
} from './schema'
import {
  type AdminSubscriptionRow,
  type CustomerOption,
  type Invoice,
  type PlanId,
  type Subscription,
  type Voucher,
  type VoucherAppliesTo,
} from './types'

const isPlanId = (value: string | null): value is PlanId =>
  value !== null && (PLAN_IDS as readonly string[]).includes(value)

const isVoucherAppliesTo = (value: string): value is VoucherAppliesTo =>
  value === VOUCHER_APPLIES_TO_ALL || isPlanId(value)

const rowToSubscription = (row: SubscriptionRow): Subscription => ({
  autoRenew: row.auto_renew,
  endDate: row.end_date,
  history: row.history,
  listPrice: row.list_price,
  price: row.price,
  startDate: row.start_date,
  type: isPlanId(row.type) ? row.type : null,
  userId: row.user_id,
  voucherCode: row.voucher_code,
  voucherId: row.voucher_id,
})

const emptySubscription = (userId: string): Subscription => ({
  autoRenew: true,
  endDate: null,
  history: [],
  listPrice: null,
  price: null,
  startDate: null,
  type: null,
  userId,
  voucherCode: null,
  voucherId: null,
})

const rowToVoucher = (row: VoucherRow): Voucher => ({
  active: row.active,
  appliesTo: isVoucherAppliesTo(row.applies_to)
    ? row.applies_to
    : VOUCHER_APPLIES_TO_ALL,
  code: row.code,
  createdAt: row.created_at,
  description: row.description,
  id: row.id,
  maxUses: row.max_uses,
  type: row.type,
  usedCount: row.used_count,
  validFrom: row.valid_from,
  validUntil: row.valid_until,
  value: row.value,
})

export const getSubscription = async (
  userId: string,
): Promise<Subscription | null> => {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  const result = SubscriptionRowSchema.safeParse(data)

  return result.success ? rowToSubscription(result.data) : null
}

export const getOwnInvoices = async (): Promise<Invoice[]> => {
  const result = await legacyApiFetch(SALES_INVOICE_LIST_ENDPOINT, {
    schema: SalesInvoiceListResponseSchema,
  })

  return result.error !== null ? [] : result.data.invoices
}

// TEMP: local Mollie test-mode account has no invoices — mocking the list so
// the /admin/facturen UI can be eyeballed. Revert once verified.
const MOCK_INVOICES: Invoice[] = [
  {
    createdAt: '2026-07-15T09:00:00+02:00',
    currency: 'EUR',
    description: 'Osago Plus — abonnement',
    dueAt: null,
    grossValue: 1799,
    id: 'inv_mock_draft1',
    isCreditNote: false,
    issuedAt: null,
    number: 'inv_mock_draft1',
    paidAt: null,
    paymentTerm: null,
    paymentUrl: null,
    pdfUrl: null,
    period: '',
    recipientEmail: 'nieuwe.klant@example.com',
    recipientIdentifier: 'nieuwe.klant@example.com#business',
    recipientName: 'Nieuwe Klant B.V.',
    status: 'draft',
  },
  {
    createdAt: '2026-07-10T09:00:00+02:00',
    currency: 'EUR',
    description: 'Osago Basis — abonnement',
    dueAt: '2026-07-24T09:00:00+02:00',
    grossValue: 999,
    id: 'inv_mock_open1',
    isCreditNote: false,
    issuedAt: '2026-07-10T09:00:00+02:00',
    number: '2026.0042',
    paidAt: null,
    paymentTerm: '14 days',
    paymentUrl: 'https://www.mollie.com/checkout/mock-open1',
    pdfUrl: 'https://www.mollie.com/pdf/mock-open1',
    period: '',
    recipientEmail: 'jan.devries@example.com',
    recipientIdentifier: 'jan.devries@example.com#consumer',
    recipientName: 'Jan de Vries',
    status: 'issued',
  },
  {
    createdAt: '2026-06-01T09:00:00+02:00',
    currency: 'EUR',
    description: 'Osago Premium — abonnement',
    dueAt: '2026-06-15T09:00:00+02:00',
    grossValue: 2499,
    id: 'inv_mock_overdue1',
    isCreditNote: false,
    issuedAt: '2026-06-01T09:00:00+02:00',
    number: '2026.0031',
    paidAt: null,
    paymentTerm: '14 days',
    paymentUrl: 'https://www.mollie.com/checkout/mock-overdue1',
    pdfUrl: 'https://www.mollie.com/pdf/mock-overdue1',
    period: '',
    recipientEmail: 'bedrijf.bv@example.com',
    recipientIdentifier: 'bedrijf.bv@example.com#business',
    recipientName: 'Bedrijf B.V.',
    status: 'issued',
  },
  {
    createdAt: '2026-05-01T09:00:00+02:00',
    currency: 'EUR',
    description: 'Waardebepaling Basis',
    dueAt: '2026-05-15T09:00:00+02:00',
    grossValue: 299,
    id: 'inv_mock_paid1',
    isCreditNote: false,
    issuedAt: '2026-05-01T09:00:00+02:00',
    number: '2026.0018',
    paidAt: '2026-05-04T09:00:00+02:00',
    paymentTerm: '14 days',
    paymentUrl: null,
    pdfUrl: 'https://www.mollie.com/pdf/mock-paid1',
    period: '',
    recipientEmail: 'anna.jansen@example.com',
    recipientIdentifier: 'anna.jansen@example.com#consumer',
    recipientName: 'Anna Jansen',
    status: 'paid',
  },
  {
    createdAt: '2026-04-20T09:00:00+02:00',
    currency: 'EUR',
    description: 'Creditnota — Osago Plus (te veel gefactureerd)',
    dueAt: null,
    grossValue: -1799,
    id: 'inv_mock_credit1',
    isCreditNote: true,
    issuedAt: '2026-04-20T09:00:00+02:00',
    number: 'C-2026.0009',
    paidAt: '2026-04-20T09:00:00+02:00',
    paymentTerm: null,
    paymentUrl: null,
    pdfUrl: 'https://www.mollie.com/pdf/mock-credit1',
    period: '',
    recipientEmail: 'jan.devries@example.com',
    recipientIdentifier: 'jan.devries@example.com#consumer',
    recipientName: 'Jan de Vries',
    status: 'paid',
  },
]

export const adminListInvoices = async (): Promise<Invoice[]> => {
  const result = await legacyApiFetch(`${SALES_INVOICE_LIST_ENDPOINT}?all=1`, {
    schema: SalesInvoiceListResponseSchema,
  })

  if (result.error !== null) {
    return MOCK_INVOICES
  }

  return result.data.invoices.length > 0 ? result.data.invoices : MOCK_INVOICES
}

export const adminListVouchers = async (): Promise<Voucher[]> => {
  const supabase = await getServerClient()
  const { data, error } = await supabase.from('vouchers').select('*')

  if (error || !data) {
    return []
  }

  return data
    .map(row => VoucherRowSchema.safeParse(row))
    .filter(result => result.success)
    .map(result => rowToVoucher(result.data))
}

export const listCustomers = async (): Promise<CustomerOption[]> => {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name')
    .eq('role', 'customer')
    .order('email')

  if (error || !data) {
    return []
  }

  return data.map(row => ({
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    userId: row.id,
  }))
}

export const adminListSubscriptions = async (): Promise<
  AdminSubscriptionRow[]
> => {
  const supabase = await getServerClient()
  const [{ data: subscriptionRows }, { data: profileRows }] =
    await Promise.all([
      supabase.from('subscriptions').select('*'),
      supabase.from('profiles').select('id, email, first_name, last_name, role'),
    ])

  const subscriptionsByUserId = new Map(
    (subscriptionRows ?? [])
      .map(row => SubscriptionRowSchema.safeParse(row))
      .filter(result => result.success)
      .map(result => [result.data.user_id, rowToSubscription(result.data)]),
  )

  // Every customer profile is listed even without a subscription (so an
  // admin can activate one), plus any profile of ANY role that already has
  // a subscriptions row — otherwise a subscription tied to a since-promoted
  // admin/admin_user account would silently disappear from this table and
  // the ARR tile, unlike legacy which never filters by role here.
  const relevantProfiles = (profileRows ?? []).filter(
    profile =>
      profile.role === 'customer' || subscriptionsByUserId.has(profile.id),
  )

  return relevantProfiles.map(profile => {
    const subscription =
      subscriptionsByUserId.get(profile.id) ?? emptySubscription(profile.id)

    return {
      ...subscription,
      customerEmail: profile.email,
      customerName:
        [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
        profile.email,
    }
  })
}
