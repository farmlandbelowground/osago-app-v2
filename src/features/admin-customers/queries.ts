import { getCompany } from '@features/company/queries'
import { getDashboardTodos } from '@features/dashboard/queries'
import { LEAD_STAGES } from '@features/leads/constants/stages'
import {
  PLANS,
  SUBSCRIPTION_STATUS_KIND,
  SUBSCRIPTION_STATUS_LABELS,
} from '@features/subscriptions/constants'
import { formatEuro } from '@features/subscriptions/lib/formatEuro'
import { invoiceStatusBadge } from '@features/subscriptions/lib/invoiceStatusBadge'
import { subStatus } from '@features/subscriptions/lib/subStatus'
import { adminListInvoices, getSubscription } from '@features/subscriptions/queries'
import { SubscriptionRowSchema } from '@features/subscriptions/schema'
import { type Subscription } from '@features/subscriptions/types'
import { getServerClient } from '@shared/supabase/server'

import { PROGRESS_PERCENT_MULTIPLIER, PROJECT_TYPE_LABELS } from './constants'
import { buildRevenueByEmail } from './lib/customerRevenue'
import {
  deriveProjectTypeForUser,
  isProjectEligible,
  nextProjectId,
} from './lib/projects'
import {
  type AdminCustomerRow,
  type AdvisorOption,
  type CustomerDetail,
  type CustomerOverview,
  type CustomerPipelineEntry,
  type ProjectCard,
  type ProjectProgress,
  type ProjectRecord,
  type ProjectType,
} from './types'

const rowToSubscription = (row: {
  auto_renew: boolean
  end_date: string | null
  history: unknown[]
  list_price: number | null
  price: number | null
  start_date: string | null
  type: string | null
  user_id: string
  voucher_code: string | null
  voucher_id: string | null
}): Subscription => ({
  autoRenew: row.auto_renew,
  endDate: row.end_date,
  history: row.history,
  listPrice: row.list_price,
  price: row.price,
  startDate: row.start_date,
  type: row.type as Subscription['type'],
  userId: row.user_id,
  voucherCode: row.voucher_code,
  voucherId: row.voucher_id,
})

const buildSubscriptionMap = async (
  supabase: Awaited<ReturnType<typeof getServerClient>>,
): Promise<Map<string, Subscription>> => {
  const { data } = await supabase.from('subscriptions').select('*')
  const map = new Map<string, Subscription>()

  for (const row of data ?? []) {
    const parsed = SubscriptionRowSchema.safeParse(row)
    if (parsed.success) {
      map.set(parsed.data.user_id, rowToSubscription(parsed.data))
    }
  }

  return map
}

export const adminListCustomers = async (): Promise<AdminCustomerRow[]> => {
  const supabase = await getServerClient()

  const [{ data: profiles }, subscriptionMap, invoices] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, first_name, last_name, company, created_at')
      .eq('role', 'customer')
      .order('created_at', { ascending: false }),
    buildSubscriptionMap(supabase),
    adminListInvoices(),
  ])

  const revenueByEmail = buildRevenueByEmail(invoices)

  return (profiles ?? []).map(profile => {
    const subscription = subscriptionMap.get(profile.id) ?? null
    const status = subStatus(subscription).status
    const plan = PLANS.find(candidate => candidate.id === subscription?.type)

    return {
      company: profile.company ?? '',
      createdAt: profile.created_at,
      email: profile.email,
      id: profile.id,
      name:
        [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
        profile.email,
      omzet: revenueByEmail.get(profile.email.toLowerCase()) ?? 0,
      planLabel: status === 'none' ? null : (plan?.label ?? null),
      statusKind: SUBSCRIPTION_STATUS_KIND[status],
      statusLabel: SUBSCRIPTION_STATUS_LABELS[status],
    }
  })
}

export const adminListAdvisors = async (): Promise<AdvisorOption[]> => {
  const supabase = await getServerClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name')
    .in('role', ['admin', 'admin_user'])
    .order('first_name', { ascending: true })

  return (data ?? []).map(row => ({
    email: row.email,
    id: row.id,
    name:
      [row.first_name, row.last_name].filter(Boolean).join(' ') || row.email,
  }))
}

const buyerName = (row: {
  contact_first_name: string | null
  contact_last_name: string | null
  name: string | null
}): string =>
  row.name ||
  [row.contact_first_name, row.contact_last_name].filter(Boolean).join(' ') ||
  '—'

export const getCustomerDetail = async (
  userId: string,
): Promise<CustomerDetail | null> => {
  const supabase = await getServerClient()

  const [
    { data: profile },
    { data: company },
    { data: valuation },
    { data: leads },
    { data: documents },
    { data: project },
    advisors,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, first_name, last_name, phone, company, created_at')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('companies')
      .select('name, sector, assigned_advisor, extra')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase.from('valuations').select('user_id').eq('user_id', userId).maybeSingle(),
    supabase.from('leads').select('*').eq('user_id', userId),
    supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false }),
    supabase
      .from('projects')
      .select('project_id')
      .eq('user_id', userId)
      .maybeSingle(),
    adminListAdvisors(),
  ])

  if (!profile) {
    return null
  }

  const extra = (company?.extra ?? {}) as Record<string, unknown>
  const employees =
    typeof extra.employees === 'number' ? extra.employees : null

  const pipeline: CustomerPipelineEntry[] = (leads ?? [])
    .filter(lead => lead.lead_type === 'pipeline')
    .map(lead => ({
      fitScore: Number(lead.fit_score ?? 0),
      id: lead.id,
      name: buyerName(lead),
      source: lead.source ?? null,
      stage: lead.stage ?? 'new',
      validatedByOsago: Boolean(lead.validated_by_osago),
    }))

  const pendingValidations = (leads ?? [])
    .filter(
      lead =>
        lead.lead_type === 'manual' &&
        lead.validation_status === 'pending_validation',
    )
    .map(lead => ({
      fee: lead.validation_fee ?? null,
      id: lead.id,
      name: buyerName(lead),
      paidAt: lead.validation_paid_at ?? null,
      type: lead.type ?? '—',
    }))

  return {
    advisorId: company?.assigned_advisor ?? null,
    advisors,
    company: company?.name ?? profile.company ?? '',
    companyProfile: { employees, sector: company?.sector ?? null },
    createdAt: profile.created_at,
    documents: (documents ?? []).map(doc => ({
      description: doc.description ?? '',
      fileName: doc.file_name,
      fileSize: doc.file_size ?? 0,
      fileType: doc.file_type ?? '',
      id: doc.id,
      uploadedAt: doc.uploaded_at ?? null,
    })),
    email: profile.email,
    firstName: profile.first_name ?? '',
    id: profile.id,
    lastName: profile.last_name ?? '',
    pendingValidations,
    phone: profile.phone ?? '',
    pipeline,
    projectId: project?.project_id ?? null,
    valuationMade: Boolean(valuation),
  }
}

// Read-only "Bekijken" overview data (openCustomerOverviewModal, D-A): identity
// + contact + the customer's projects + invoices. v2 has no customerId (legacy's
// K###### was localStorage-derived) → null. Omzet/invoices attributed by
// recipientEmail (v2 invoices carry no user_id).
export const getCustomerOverview = async (
  userId: string,
): Promise<CustomerOverview | null> => {
  const supabase = await getServerClient()

  const [{ data: profile }, company, subscription, { data: projectRows }, invoices] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id, email, first_name, last_name, phone, company, created_at')
        .eq('id', userId)
        .maybeSingle(),
      getCompany(userId),
      getSubscription(userId),
      supabase.from('projects').select('project_id, type').eq('user_id', userId),
      adminListInvoices(),
    ])

  if (!profile) {
    return null
  }

  const companyName = company?.name || profile.company || '—'
  const sector = company?.sector || '—'
  const line1 = [
    company?.street,
    [company?.houseNumber, company?.houseNumberExtra].filter(Boolean).join(''),
  ]
    .filter(Boolean)
    .join(' ')
    .trim()
  const line2 = [company?.postalCode, company?.city]
    .filter(Boolean)
    .join(' ')
    .trim()

  const projects = (projectRows ?? []).map(row => ({
    name: companyName,
    projectId: row.project_id,
    sector,
    typeLabel:
      PROJECT_TYPE_LABELS[
        deriveProjectTypeForUser(
          subscription,
          row.type === 'waardebepaling' ? 'waardebepaling' : 'verkoop',
        )
      ],
  }))

  const email = profile.email.toLowerCase()
  const customerInvoices = invoices
    .filter(invoice => invoice.recipientEmail.toLowerCase() === email)
    .map(invoice => {
      const badge = invoiceStatusBadge(invoice)

      return {
        amount: invoice.grossValue ?? 0,
        description: invoice.description,
        id: invoice.id,
        issuedAt: invoice.issuedAt,
        number: invoice.number,
        statusKind: badge.kind,
        statusLabel: badge.label,
      }
    })

  return {
    addressLines: [line1, line2].filter(Boolean),
    companyName,
    createdAt: profile.created_at,
    customerId: null,
    email: profile.email,
    firstName: profile.first_name ?? '',
    invoices: customerInvoices,
    lastName: profile.last_name ?? '',
    phone: profile.phone ?? '',
    projects,
  }
}

const PROGRESSING_STAGES = LEAD_STAGES.filter(
  stage => stage.id !== 'no_interest',
)

const extractValuationValue = (result: unknown): number | null => {
  if (!result || typeof result !== 'object') {
    return null
  }
  const record = result as Record<string, unknown>
  for (const key of ['midpoint', 'ondernemingswaarde', 'value']) {
    const candidate = record[key]
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate
    }
  }
  return null
}

// Reads the real public.projects table (admin RLS, confirmed) and ensure-inserts
// a row for any lopend-sub customer that lacks one. Insert under RLS is unverified
// (§1 data note): the insert is best-effort — on failure the derived project is
// still shown (recomputed each load), so the observable UI is identical. Formal-
// izing the insert policy is future work in supabase/.
export const getAdminProjects = async (): Promise<ProjectCard[]> => {
  const supabase = await getServerClient()

  const [
    { data: projectRows },
    { data: profiles },
    subscriptionMap,
    { data: companies },
    { data: valuations },
    { data: pipelineLeads },
  ] = await Promise.all([
    supabase.from('projects').select('*'),
    supabase
      .from('profiles')
      .select('id, first_name, last_name, company')
      .eq('role', 'customer'),
    buildSubscriptionMap(supabase),
    supabase.from('companies').select('user_id, name, sector'),
    supabase.from('valuations').select('user_id, result'),
    supabase.from('leads').select('user_id, stage, lead_type'),
  ])

  const companyByUser = new Map(
    (companies ?? []).map(row => [row.user_id, row]),
  )
  const valuationByUser = new Map(
    (valuations ?? []).map(row => [row.user_id, row.result]),
  )
  const pipelineByUser = new Map<string, string[]>()
  for (const lead of pipelineLeads ?? []) {
    if (lead.lead_type === 'pipeline') {
      const stages = pipelineByUser.get(lead.user_id) ?? []
      stages.push(lead.stage ?? 'new')
      pipelineByUser.set(lead.user_id, stages)
    }
  }

  const projectByUser = new Map<string, ProjectRecord>()
  const existingIds: string[] = []
  for (const row of projectRows ?? []) {
    existingIds.push(row.project_id)
    projectByUser.set(row.user_id, {
      createdAt: row.created_at ?? null,
      projectId: row.project_id,
      type: row.type === 'waardebepaling' ? 'waardebepaling' : 'verkoop',
      userId: row.user_id,
    })
  }

  const toInsert: {
    created_at: string
    id: string
    project_id: string
    type: ProjectType
    user_id: string
  }[] = []

  for (const profile of profiles ?? []) {
    if (projectByUser.has(profile.id)) {
      continue
    }
    const subscription = subscriptionMap.get(profile.id) ?? null
    if (!isProjectEligible(subscription)) {
      continue
    }

    const projectId = nextProjectId(existingIds)
    existingIds.push(projectId)
    const type = deriveProjectTypeForUser(subscription, null)
    const record: ProjectRecord = {
      createdAt: null,
      projectId,
      type,
      userId: profile.id,
    }
    projectByUser.set(profile.id, record)
    toInsert.push({
      created_at: new Date().toISOString(),
      id: `prj_${crypto.randomUUID()}`,
      project_id: projectId,
      type,
      user_id: profile.id,
    })
  }

  if (toInsert.length > 0) {
    // Best-effort persistence; ignored if the insert RLS policy is absent.
    await supabase.from('projects').insert(toInsert)
  }

  const profileByUser = new Map((profiles ?? []).map(row => [row.id, row]))

  // "Voortgang dashboard" per project card — reuse the customer-dashboard todo
  // computation (getDashboardTodos) so the count matches what the customer sees
  // on their own dashboard (legacy computeCustomerDashboardProgress, :24759).
  const eligibleUserIds = [...projectByUser.values()]
    .filter(project => profileByUser.has(project.userId))
    .map(project => project.userId)
  const progressEntries = await Promise.all(
    eligibleUserIds.map(async id => {
      const todos = await getDashboardTodos(id)
      const total = todos.length
      const completed = todos.filter(todo => todo.done).length
      const progress: ProjectProgress = {
        completed,
        pct:
          total > 0
            ? Math.round((completed / total) * PROGRESS_PERCENT_MULTIPLIER)
            : 0,
        total,
      }
      return [id, progress] as const
    }),
  )
  const progressByUser = new Map<string, ProjectProgress>(progressEntries)

  return [...projectByUser.values()]
    .filter(project => profileByUser.has(project.userId))
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .map(project => {
      const profile = profileByUser.get(project.userId)
      const company = companyByUser.get(project.userId)
      const stages = pipelineByUser.get(project.userId) ?? []
      const furthestIndex = stages.reduce((max, stage) => {
        const index = PROGRESSING_STAGES.findIndex(item => item.id === stage)
        return index > max ? index : max
      }, -1)
      const value = extractValuationValue(valuationByUser.get(project.userId))

      return {
        companyName: company?.name ?? profile?.company ?? '—',
        customerName:
          [profile?.first_name, profile?.last_name]
            .filter(Boolean)
            .join(' ') || '—',
        furthestStageLabel:
          furthestIndex >= 0 ? PROGRESSING_STAGES[furthestIndex].label : '—',
        isVerkoop: project.type === 'verkoop',
        pipelineCount: stages.length,
        progress: progressByUser.get(project.userId) ?? {
          completed: 0,
          pct: 0,
          total: 0,
        },
        projectId: project.projectId,
        sector: company?.sector ?? '—',
        type: project.type,
        userId: project.userId,
        valueLabel: value !== null ? formatEuro(value) : null,
      }
    })
}
