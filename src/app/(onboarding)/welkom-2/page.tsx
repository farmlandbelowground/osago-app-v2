import Link from 'next/link'

import {
  OnboardingShell,
  OnboardingSubscribeIntentPicker,
  OnboardingSubscribeSuccessCard,
  SUBSCRIBE_INTENT_COPY,
  WELKOM_PATHS,
} from '@features/onboarding'
import {
  SubscribeConfirmModal,
  SubscribePlanGrid,
} from '@features/subscriptions'
import { PLANS, SUBSCRIPTION_ARR_STATUSES } from '@features/subscriptions/constants'
import { subStatus } from '@features/subscriptions/lib/subStatus'
import { getSubscription } from '@features/subscriptions/queries'
import { requireSession } from '@shared/auth/session'

interface Props {
  searchParams: Promise<{ intent?: string; plan?: string }>
}

export default async function Welkom2Page({ searchParams }: Props) {
  const session = await requireSession()
  const { intent, plan: planId } = await searchParams

  const subscription = await getSubscription(session.user.id)
  const status = subStatus(subscription)
  const isComplete = SUBSCRIPTION_ARR_STATUSES.includes(status.status)
  const selectedPlan = PLANS.find(plan => plan.id === planId) ?? null
  const category = intent === 'full' || intent === 'valuation' ? intent : null

  return (
    <OnboardingShell
      completeHint="Sluit een abonnement af om verder te gaan."
      isStepComplete={isComplete}
      stepIndex={2}
    >
      {isComplete && subscription ? (
        <OnboardingSubscribeSuccessCard subscription={subscription} />
      ) : category ? (
        <>
          <div className="page-header">
            <div>
              <h1 className="page-title">
                {SUBSCRIBE_INTENT_COPY[category].headline}
              </h1>
              <p className="page-sub text-muted text-sm" style={{ marginTop: 4 }}>
                {SUBSCRIBE_INTENT_COPY[category].subtext}
              </p>
            </div>
            <div className="page-actions">
              <Link className="btn btn-ghost btn-sm" href={WELKOM_PATHS[2]}>
                <svg
                  fill="none"
                  height="13"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ marginRight: 4, verticalAlign: -2 }}
                  viewBox="0 0 24 24"
                  width="13"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Andere optie kiezen
              </Link>
            </div>
          </div>
          <SubscribePlanGrid
            basePath={`${WELKOM_PATHS[2]}?intent=${category}`}
            category={category}
          />
          {selectedPlan && (
            <SubscribeConfirmModal
              basePath={`${WELKOM_PATHS[2]}?intent=${category}`}
              plan={selectedPlan}
            />
          )}
        </>
      ) : (
        <OnboardingSubscribeIntentPicker />
      )}
    </OnboardingShell>
  )
}
