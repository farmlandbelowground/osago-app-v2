import { type Metadata } from 'next'

import { AdminSubscriptionsTable } from '@features/subscriptions'
import { adminListSubscriptions } from '@features/subscriptions/queries'

export const metadata: Metadata = {
  title: 'Abonnementen',
}

export default async function AdminAbonnementenPage() {
  const subscriptions = await adminListSubscriptions()

  return (
    <main className="main">
      <AdminSubscriptionsTable subscriptions={subscriptions} />
    </main>
  )
}
