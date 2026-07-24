import { type Metadata } from 'next'
import { redirect } from 'next/navigation'

import {
  SubscribeConfirmModal,
  SubscribePlanGrid,
  SubscribeReturnStatus,
} from '@features/subscriptions'
import { reconcileSubscriptionReturn } from '@features/subscriptions/actions'
import { ACCOUNT_PATH, PLANS } from '@features/subscriptions/constants'

interface Props {
  searchParams: Promise<{ paid?: string; plan?: string }>
}

export const metadata: Metadata = {
  title: 'Abonnement',
}

export default async function AbonnementAfsluitenPage({ searchParams }: Props) {
  const { paid, plan: planId } = await searchParams

  if (paid === '1') {
    const outcome = await reconcileSubscriptionReturn()

    if (outcome.activated > 0) {
      redirect(ACCOUNT_PATH)
    }

    return <SubscribeReturnStatus error={outcome.error} />
  }

  const selectedPlan = PLANS.find(plan => plan.id === planId) ?? null

  return (
    <main className="main">
      <SubscribePlanGrid />
      {selectedPlan && <SubscribeConfirmModal plan={selectedPlan} />}
    </main>
  )
}
