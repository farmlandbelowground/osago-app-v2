import {
  DashboardKpiRow,
  DashboardTodoList,
  DashboardWelcomeVideoCard,
  WELCOME_VIDEO_DONE_THRESHOLD,
  getBuyerPipelineCounts,
  getDashboardTodos,
} from '@features/dashboard'
import { requireSession } from '@shared/auth/session'

export default async function DashboardPage() {
  const session = await requireSession()

  const [todos, buyerPipelineCounts] = await Promise.all([
    getDashboardTodos(session.user.id),
    getBuyerPipelineCounts(session.user.id),
  ])

  return (
    <main className="main">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welkom, {session.firstName}.</h1>
        </div>
      </div>
      <DashboardKpiRow counts={buyerPipelineCounts} />
      {todos.filter(todo => todo.done).length <
        WELCOME_VIDEO_DONE_THRESHOLD && <DashboardWelcomeVideoCard />}
      <DashboardTodoList todos={todos} />
    </main>
  )
}
