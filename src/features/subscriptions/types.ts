import { type PLAN_IDS, type VOUCHER_APPLIES_TO_ALL } from './constants'

export type { Invoice } from './schema'

export type PlanId = (typeof PLAN_IDS)[number]
export type PlanCategory = 'full' | 'valuation'
export type VoucherAppliesTo = PlanId | typeof VOUCHER_APPLIES_TO_ALL

export interface PlanFeature {
  included: boolean
  text: string
}

export interface Plan {
  category: PlanCategory
  ctaLabel: string
  desc: string
  features: PlanFeature[]
  id: PlanId
  label: string
  price: number
  priceMeta: string
  cardLabel?: string
  featured?: boolean
}

export type BadgeKind = 'danger' | 'info' | 'neutral' | 'success' | 'warning'

export type SubscriptionStatus =
  'active' | 'ending' | 'expired' | 'none' | 'renewed'

export interface SubStatusResult {
  cancelDate: string | null
  daysUntilCancel: number | null
  status: SubscriptionStatus
}

export type LockReason = 'expired' | 'overdue' | null

export type VoucherStatus =
  'active' | 'deactivated' | 'depleted' | 'expired' | 'notYetValid'

export interface Subscription {
  autoRenew: boolean
  endDate: string | null
  history: unknown[]
  listPrice: number | null
  price: number | null
  startDate: string | null
  type: PlanId | null
  userId: string
  voucherCode: string | null
  voucherId: string | null
}

export interface Voucher {
  active: boolean
  appliesTo: VoucherAppliesTo
  code: string
  createdAt: string
  description: string | null
  id: string
  maxUses: number | null
  type: 'fixed' | 'percentage'
  usedCount: number
  validFrom: string | null
  validUntil: string | null
  value: number
}

export type InvoiceFilterPreset =
  'all' | 'custom' | 'month' | 'quarter' | 'year'

export interface InvoiceFilter {
  from: string | null
  preset: InvoiceFilterPreset
  to: string | null
}

export interface AdminSubscriptionRow extends Subscription {
  customerEmail: string
  customerName: string
}

export interface CustomerOption {
  email: string
  firstName: string | null
  lastName: string | null
  userId: string
}

export interface CustomerSelectOption {
  label: string
  userId: string
}
