import { AdminSubscriptionsTable } from '@features/subscriptions'
import { adminListSubscriptions } from '@features/subscriptions/queries'

export default async function AdminAbonnementenPage() {
  const subscriptions = await adminListSubscriptions()

  return (
    <main className="main">
      <AdminSubscriptionsTable subscriptions={subscriptions} />
    </main>
  )
}
