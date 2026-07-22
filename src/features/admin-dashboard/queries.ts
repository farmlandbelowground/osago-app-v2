import { adminListInvoices } from '@features/subscriptions/queries'
import { SubscriptionRowSchema } from '@features/subscriptions/schema'
import { type Subscription } from '@features/subscriptions/types'
import { getServerClient } from '@shared/supabase/server'

import {
  type DashboardCustomer,
  type DashboardData,
  type DashboardInvoice,
} from './types'

const toMs = (value: string | null): number | null =>
  value ? Date.parse(value) : null

// Admin-direct reads under is_admin() RLS (profiles + subscriptions) plus the
// frozen sales-invoice list. Mirrors legacy renderAdminDashboard's db.users /
// db.invoices sources; customers = profiles with role 'customer'.
export const getAdminDashboardData = async (): Promise<DashboardData> => {
  const supabase = await getServerClient()

  const [{ data: profileRows }, { data: subscriptionRows }, invoiceList] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id, email, first_name, last_name, company, created_at')
        .eq('role', 'customer'),
      supabase.from('subscriptions').select('*'),
      adminListInvoices(),
    ])

  const subscriptionByUser = new Map<string, Subscription>()

  for (const row of subscriptionRows ?? []) {
    const parsed = SubscriptionRowSchema.safeParse(row)

    if (!parsed.success) {
      continue
    }

    const data = parsed.data
    subscriptionByUser.set(data.user_id, {
      autoRenew: data.auto_renew,
      endDate: data.end_date,
      history: data.history,
      listPrice: data.list_price,
      price: data.price,
      startDate: data.start_date,
      type: data.type as Subscription['type'],
      userId: data.user_id,
      voucherCode: data.voucher_code,
      voucherId: data.voucher_id,
    })
  }

  const customers: DashboardCustomer[] = (profileRows ?? []).map(profile => ({
    company: profile.company ?? '',
    createdAt: toMs(profile.created_at),
    email: profile.email,
    firstName: profile.first_name,
    id: profile.id,
    lastName: profile.last_name,
    subscription: subscriptionByUser.get(profile.id) ?? null,
  }))

  const invoices: DashboardInvoice[] = invoiceList.map(invoice => ({
    grossValue: invoice.grossValue ?? 0,
    issuedAt: toMs(invoice.issuedAt),
    status: invoice.status,
  }))

  return { customers, invoices }
}
