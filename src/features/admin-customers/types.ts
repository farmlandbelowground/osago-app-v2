import { type BadgeKind } from '@features/subscriptions/types'

export type ProjectType = 'verkoop' | 'waardebepaling'

export interface AdminCustomerRow {
  company: string
  createdAt: string | null
  email: string
  id: string
  name: string
  omzet: number
  planLabel: string | null
  statusKind: BadgeKind
  statusLabel: string
}

export interface AdvisorOption {
  email: string
  id: string
  name: string
}

export interface PendingValidation {
  fee: number | null
  id: string
  name: string
  paidAt: string | null
  type: string
}

export interface CustomerPipelineEntry {
  fitScore: number
  id: string
  name: string
  source: string | null
  stage: string
  validatedByOsago: boolean
}

export interface CustomerDocument {
  description: string
  fileName: string
  fileSize: number
  fileType: string
  id: string
  uploadedAt: string | null
}

export interface CustomerCompanyProfile {
  employees: number | null
  sector: string | null
}

export interface CustomerDetail {
  advisorId: string | null
  advisors: AdvisorOption[]
  company: string
  companyProfile: CustomerCompanyProfile
  createdAt: string | null
  documents: CustomerDocument[]
  email: string
  firstName: string
  id: string
  lastName: string
  pendingValidations: PendingValidation[]
  phone: string
  pipeline: CustomerPipelineEntry[]
  projectId: string | null
  valuationMade: boolean
}

export interface ProjectRecord {
  createdAt: string | null
  projectId: string
  type: ProjectType
  userId: string
}

export interface ProjectProgress {
  completed: number
  pct: number
  total: number
}

export interface ProjectCard {
  companyName: string
  customerName: string
  furthestStageLabel: string
  isVerkoop: boolean
  pipelineCount: number
  progress: ProjectProgress
  projectId: string
  sector: string
  type: ProjectType
  userId: string
  valueLabel: string | null
}

export interface CustomerOverviewProject {
  name: string
  projectId: string
  sector: string
  typeLabel: string
}

export interface CustomerOverviewInvoice {
  amount: number
  description: string
  id: string
  issuedAt: string | null
  number: string
  statusKind: BadgeKind
  statusLabel: string
}

export interface CustomerOverview {
  addressLines: string[]
  companyName: string
  createdAt: string | null
  customerId: string | null
  email: string
  firstName: string
  invoices: CustomerOverviewInvoice[]
  lastName: string
  phone: string
  projects: CustomerOverviewProject[]
}
