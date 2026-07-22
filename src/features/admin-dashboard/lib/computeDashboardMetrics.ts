import { PLANS } from '@features/subscriptions/constants'
import { subStatus } from '@features/subscriptions/lib/subStatus'

import {
  LOPEND_STATUSES,
  PERCENT_MULTIPLIER,
  RECENT_CUSTOMERS_LIMIT,
} from '../constants'
import {
  type DashboardData,
  type DashboardMetrics,
  type DashboardPreset,
  type DashboardRange,
} from '../types'

const isLopend = (status: string): boolean =>
  (LOPEND_STATUSES as readonly string[]).includes(status)

const toMs = (value: string | null): number | null =>
  value ? new Date(value).getTime() : null

const planCategory = (type: string | null): string =>
  PLANS.find(plan => plan.id === type)?.category ?? 'full'

// Pure port of the derivations inside renderAdminDashboard (osago-bundle.js:23884).
// KPIs + donut respect the range; the met/zonder split and recent-customers
// table are always current/unfiltered.
export const computeDashboardMetrics = (
  data: DashboardData,
  range: DashboardRange,
  preset: DashboardPreset,
): DashboardMetrics => {
  const { customers, invoices } = data

  const inRange = (ts: number | null): boolean => {
    if (ts === null) {
      return preset === 'all'
    }
    if (range.from !== null && ts < range.from) {
      return false
    }
    if (range.to !== null && ts > range.to) {
      return false
    }
    return true
  }

  const paid = invoices.filter(
    invoice => invoice.status === 'paid' && inRange(invoice.issuedAt),
  )
  const omzet = paid.reduce((sum, invoice) => sum + invoice.grossValue, 0)

  // v2's normalized invoices use 'issued' for sent-but-unpaid; there is no
  // 'open'/'overdue' status (legacy had both) — 'issued' is the equivalent.
  const open = invoices.filter(
    invoice => invoice.status === 'issued' && inRange(invoice.issuedAt),
  )
  const openstaand = open.reduce((sum, invoice) => sum + invoice.grossValue, 0)

  const lopende = customers.filter(customer => {
    const subscription = customer.subscription

    if (!subscription || !isLopend(subStatus(subscription).status)) {
      return false
    }
    if (preset === 'all') {
      return true
    }

    const endMs = toMs(subscription.endDate)
    const startMs = toMs(subscription.startDate)

    if (range.from !== null && endMs !== null && endMs < range.from) {
      return false
    }
    if (range.to !== null && startMs !== null && startMs > range.to) {
      return false
    }
    return true
  })

  const verkoopCount = lopende.filter(
    customer => planCategory(customer.subscription?.type ?? null) === 'full',
  ).length
  const waardeCount = lopende.filter(
    customer =>
      planCategory(customer.subscription?.type ?? null) === 'valuation',
  ).length

  const nieuweCount = customers.filter(customer =>
    inRange(customer.createdAt),
  ).length

  const usersWithActiveSub = customers.filter(customer =>
    isLopend(subStatus(customer.subscription).status),
  ).length
  const totalUsers = customers.length
  const pctMet =
    totalUsers > 0
      ? Math.round((usersWithActiveSub / totalUsers) * PERCENT_MULTIPLIER)
      : 0
  const pctZonder = totalUsers > 0 ? PERCENT_MULTIPLIER - pctMet : 0

  const recentCustomers = [...customers]
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
    .slice(0, RECENT_CUSTOMERS_LIMIT)
    .map(customer => ({
      company: customer.company,
      createdAt: customer.createdAt,
      email: customer.email,
      name:
        [customer.firstName, customer.lastName].filter(Boolean).join(' ') ||
        customer.email,
    }))

  return {
    lopendeCount: lopende.length,
    nieuweCount,
    omzet,
    openCount: open.length,
    openstaand,
    paidCount: paid.length,
    pctMet,
    pctZonder,
    recentCustomers,
    totalUsers,
    usersWithActiveSub,
    verkoopCount,
    waardeCount,
  }
}
