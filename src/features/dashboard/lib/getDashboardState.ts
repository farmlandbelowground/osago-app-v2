import {
  getIdentityStatus,
  type IdentityProfile,
} from '@features/identity'
import {
  getPreparationState,
  type PreparationState,
} from '@features/preparation'
import { hasActiveSubscription } from '@features/subscriptions/lib/hasActiveSubscription'
import { getSubscription } from '@features/subscriptions/queries'
import { type Subscription } from '@features/subscriptions/types'

// The four dashboard variants the mockups drive (docx §2/§3/§4/§5).
// Order matters: subscription first, then preparation completion, then
// identity verification. Anything short of all three yields the earliest
// non-satisfied state.
export type DashboardState =
  | { kind: 'in_preparation'; preparation: PreparationState }
  | { kind: 'in_sales' }
  | { kind: 'no_subscription'; subscription: Subscription | null }
  | {
      identity: IdentityProfile
      kind: 'verification_required'
      preparation: PreparationState
    }

export const getDashboardState = async (
  userId: string,
): Promise<DashboardState> => {
  const subscription = await getSubscription(userId)
  if (!hasActiveSubscription(subscription)) {
    return { kind: 'no_subscription', subscription }
  }

  const [preparation, identity] = await Promise.all([
    getPreparationState(userId),
    getIdentityStatus(userId),
  ])

  if (!preparation.isComplete) {
    return { kind: 'in_preparation', preparation }
  }
  if (identity.status !== 'verified') {
    return { identity, kind: 'verification_required', preparation }
  }
  return { kind: 'in_sales' }
}
