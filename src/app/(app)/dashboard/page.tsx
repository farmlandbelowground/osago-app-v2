import { type Metadata } from 'next'

import {
  ConversionDashboard,
  PreparationDashboard,
  SalesDashboard,
  VerificationRequiredDashboard,
  getDashboardState,
} from '@features/dashboard'
import { getCompany } from '@features/company/queries'
import { getPipelineLeads } from '@features/leads'
import { requireSession } from '@shared/auth/session'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage() {
  const session = await requireSession()
  const state = await getDashboardState(session.user.id)

  if (state.kind === 'no_subscription') {
    return <ConversionDashboard firstName={session.firstName} />
  }

  if (state.kind === 'in_preparation') {
    return (
      <PreparationDashboard
        firstName={session.firstName}
        preparation={state.preparation}
      />
    )
  }

  if (state.kind === 'verification_required') {
    return (
      <VerificationRequiredDashboard
        firstName={session.firstName}
        identity={state.identity}
      />
    )
  }

  // in_sales — pipeline kanban + operational to-dos + stage-matched upsells
  const [leads, company] = await Promise.all([
    getPipelineLeads(session.user.id),
    getCompany(session.user.id),
  ])

  return (
    <SalesDashboard
      companyHasName={Boolean(company?.name?.trim())}
      firstName={session.firstName}
      isMedewerker={Boolean(session.impersonatedBy)}
      leads={leads}
    />
  )
}
