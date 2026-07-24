import {
  DashboardKpiRow,
  DashboardTodoList,
  DashboardWelcomeVideoCard,
  WELCOME_VIDEO_DONE_THRESHOLD,
  getBuyerPipelineCounts,
  getDashboardTodos,
  getDashboardValuation,
} from '@features/dashboard'
import { hasWerkruimteAccess } from '@features/subscriptions/lib/hasWerkruimteAccess'
import { getSubscription } from '@features/subscriptions/queries'
import { requireSession } from '@shared/auth/session'

export default async function DashboardPage() {
  const session = await requireSession()

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
