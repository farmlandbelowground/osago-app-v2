import { type Metadata } from 'next'

import {
  ConversionDashboard,
  DashboardKpiRow,
  DashboardTodoList,
  DashboardWelcomeVideoCard,
  PreparationDashboard,
  VerificationRequiredDashboard,
  WELCOME_VIDEO_DONE_THRESHOLD,
  getBuyerPipelineCounts,
  getDashboardState,
  getDashboardTodos,
  getDashboardValuation,
} from '@features/dashboard'
import { hasWerkruimteAccess } from '@features/subscriptions/lib/hasWerkruimteAccess'
import { getSubscription } from '@features/subscriptions/queries'
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

  // Fase 2f takes over the in_sales kind; until then, fall back to the
  // operational KPIs + to-do list.
  const [todos, buyerPipelineCounts, valuation, subscription] =
    await Promise.all([
      getDashboardTodos(session.user.id),
      getBuyerPipelineCounts(session.user.id),
      getDashboardValuation(session.user.id),
      getSubscription(session.user.id),
    ])

  return (
    <main className="main">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welkom, {session.firstName}.</h1>
        </div>
      </div>
      <DashboardKpiRow
        counts={buyerPipelineCounts}
        hasWerkruimteAccess={hasWerkruimteAccess(subscription)}
        valuation={valuation}
      />
      {todos.filter(todo => todo.done).length <
        WELCOME_VIDEO_DONE_THRESHOLD && <DashboardWelcomeVideoCard />}
      <DashboardTodoList todos={todos} />
    </main>
  )
}
