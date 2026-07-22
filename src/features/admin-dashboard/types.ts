import { type Subscription } from '@features/subscriptions/types'

export type DashboardPreset = 'all' | 'custom' | 'month' | 'quarter' | 'year'

export interface DashboardFilter {
  from: string | null
  preset: DashboardPreset
  to: string | null
}

export interface DashboardRange {
  from: number | null
  to: number | null
}

export interface DashboardCustomer {
  company: string
  createdAt: number | null
  email: string
  firstName: string | null
  id: string
  lastName: string | null
  subscription: Subscription | null
}

export interface DashboardInvoice {
  grossValue: number
  issuedAt: number | null
  status: string
}

export interface DashboardData {
  customers: DashboardCustomer[]
  invoices: DashboardInvoice[]
}

export interface DashboardRecentCustomer {
  company: string
  createdAt: number | null
  email: string
  name: string
}

export interface DashboardMetrics {
  lopendeCount: number
  nieuweCount: number
  omzet: number
  openCount: number
  openstaand: number
  paidCount: number
  pctMet: number
  pctZonder: number
  recentCustomers: DashboardRecentCustomer[]
  totalUsers: number
  usersWithActiveSub: number
  verkoopCount: number
  waardeCount: number
}
