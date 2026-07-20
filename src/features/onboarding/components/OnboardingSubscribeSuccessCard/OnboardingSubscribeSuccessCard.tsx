import { type FC } from 'react'

import { PLANS } from '@features/subscriptions/constants'
import { formatDateNl } from '@features/subscriptions/lib/formatDateNl'

import { type Props } from './types'

const CheckIcon: FC = () => (
  <svg
    fill="none"
    height="30"
    stroke="currentColor"
    strokeWidth="3"
    viewBox="0 0 24 24"
    width="30"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export const OnboardingSubscribeSuccessCard: FC<Props> = ({ subscription }) => {
  const plan = PLANS.find(candidate => candidate.id === subscription.type)

  return (
    <div
      className="card"
      style={{ margin: '0 auto', maxWidth: 560, padding: '56px 32px', textAlign: 'center' }}
    >
      <div
        style={{
          alignItems: 'center',
          background: 'var(--green-soft)',
          borderRadius: '50%',
          color: 'var(--green-dark)',
          display: 'inline-flex',
          height: 64,
          justifyContent: 'center',
          marginBottom: 18,
          width: 64,
        }}
      >
        <CheckIcon />
      </div>
      <h2 className="serif" style={{ fontSize: 26, fontWeight: 700, margin: '0 0 10px' }}>
        Abonnement geactiveerd
      </h2>
      <p style={{ color: 'var(--ink-2)', fontSize: 15, margin: '0 0 8px' }}>
        Jouw <strong>{plan?.label ?? subscription.type}</strong>-abonnement is
        actief tot{' '}
        <strong>
          {subscription.endDate ? formatDateNl(subscription.endDate) : '—'}
        </strong>
        .
      </p>
      <p className="text-muted text-sm" style={{ marginTop: 16 }}>
        Klik op <strong>Onboarding voltooien</strong> rechtsonder om naar het
        dashboard te gaan.
      </p>
    </div>
  )
}
