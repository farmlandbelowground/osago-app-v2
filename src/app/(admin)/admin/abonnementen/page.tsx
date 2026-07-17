import { AdminSubscriptionsTable } from '@features/subscriptions'
import { adminListSubscriptions } from '@features/subscriptions/queries'

export default async function AdminAbonnementenPage() {
  const subscriptions = await adminListSubscriptions()

  return (
    <main
      className={`
        w-full px-10 py-8
        max-[900px]:p-5
      `}
    >
      <AdminSubscriptionsTable subscriptions={subscriptions} />
    </main>
  )
}
