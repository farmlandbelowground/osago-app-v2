'use client'

import Link from 'next/link'
import { useState, type FC, type ReactNode } from 'react'

import { useToastStore } from '@shared/store/toast'

import { toggleAutoRenew } from '../../actions'
import {
  ABONNEMENT_AFSLUITEN_PATH,
  CANCEL_WARNING_WINDOW_DAYS,
  MIN_PLAN_PRICE,
  PLANS,
} from '../../constants'
import { formatDateNl } from '../../lib/formatDateNl'
import { formatEuro } from '../../lib/formatEuro'
import { subStatus } from '../../lib/subStatus'
import { SubscriptionStatusBadge } from '../SubscriptionStatusBadge'
import { type Props } from './types'

const StarIcon: FC = () => (
  <svg
    fill="none"
    height="22"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="22"
  >
    <path d="M12 2 15 8h6l-5 4 2 7-6-4-6 4 2-7-5-4h6z" />
  </svg>
)

const ArrowRightIcon: FC = () => (
  <svg
    fill="none"
    height="13"
    stroke="currentColor"
    strokeWidth="2"
    style={{ verticalAlign: -2, marginLeft: 4 }}
    viewBox="0 0 24 24"
    width="13"
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)

const TriangleWarningIcon: FC = () => (
  <svg
    fill="none"
    height="16"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="16"
  >
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" x2="12" y1="9" y2="13" />
    <line x1="12" x2="12.01" y1="17" y2="17" />
  </svg>
)

const CircleWarningIcon: FC = () => (
  <svg
    fill="none"
    height="16"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="16"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
)

const SubWarningBanner: FC<{ children: ReactNode; icon: ReactNode }> = ({
  children,
  icon,
}) => (
  <div className="sub-warn">
    {icon}
    <div>{children}</div>
  </div>
)

export const AccountSubscriptionCard: FC<Props> = ({ subscription }) => {
  const [isPending, setIsPending] = useState(false)
  const showToast = useToastStore(state => state.showToast)
  const { cancelDate, daysUntilCancel, status } = subStatus(subscription)

  const onToggleAutoRenew = async (checked: boolean): Promise<void> => {
    setIsPending(true)
    const result = await toggleAutoRenew(checked)
    setIsPending(false)

    if (result.error) {
      showToast(result.error, 'error')
      return
    }

    showToast(
      checked
        ? 'Automatisch verlengen ingeschakeld.'
        : 'Automatisch verlengen uitgeschakeld. Jouw abonnement loopt automatisch af op de einddatum.',
    )
  }

  if (status === 'none' || status === 'expired') {
    const isExpired = status === 'expired'

    return (
      <div className="card mb-5">
        <h3>Mijn abonnement</h3>
        <p className="desc">
          {isExpired
            ? 'Jouw vorige abonnement is verlopen. Sluit een nieuw abonnement af om weer volledig toegang te krijgen.'
            : 'Je hebt nog geen actief abonnement. Sluit een abonnement af om volledige toegang te krijgen tot alle Osago functies.'}
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: 16,
            background: 'linear-gradient(135deg,var(--green-soft),#FFF)',
            border: '1px solid var(--green)',
            borderRadius: 'var(--radius)',
            marginTop: 16,
          }}
        >
          <div
            style={{
              flexShrink: 0,
              width: 44,
              height: 44,
              borderRadius: 10,
              background: 'var(--green)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <StarIcon />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 600,
                color: 'var(--ink)',
                marginBottom: 2,
              }}
            >
              Kies een passend abonnement
            </div>
            <div className="text-sm text-muted">
              Vijf plannen vanaf {formatEuro(MIN_PLAN_PRICE)} per 6 maanden.
            </div>
          </div>
          <Link className="btn btn-primary" href={ABONNEMENT_AFSLUITEN_PATH}>
            {isExpired ? 'Nieuw abonnement afsluiten' : 'Abonnement afsluiten'}
            <ArrowRightIcon />
          </Link>
        </div>
      </div>
    )
  }

  if (!subscription) {
    return null
  }

  const plan = PLANS.find(candidate => candidate.id === subscription.type)
  const price = subscription.price ?? plan?.price ?? 0
  const showCancelWarning =
    subscription.autoRenew &&
    daysUntilCancel !== null &&
    daysUntilCancel >= 0 &&
    daysUntilCancel <= CANCEL_WARNING_WINDOW_DAYS
  const showEndingWarning =
    !subscription.autoRenew && (status === 'active' || status === 'ending')

  return (
    <div className="card mb-5">
      <div className="sub-status-line">
        <div>
          <h3 style={{ marginBottom: 2 }}>Mijn abonnement</h3>
          <p className="desc" style={{ marginBottom: 0 }}>
            Beheer hier jouw abonnement op Osago.
          </p>
        </div>
        <SubscriptionStatusBadge status={status} />
      </div>

      <div className="sub-grid">
        <div className="sub-grid-item">
          <span className="sub-grid-label">Type abonnement</span>
          <span className="sub-grid-value">
            <strong>{plan?.label ?? subscription.type}</strong>
          </span>
        </div>
        <div className="sub-grid-item">
          <span className="sub-grid-label">Prijs per 6 maanden</span>
          <span className="sub-grid-value">
            <strong>{formatEuro(price)}</strong>
          </span>
        </div>
        <div className="sub-grid-item">
          <span className="sub-grid-label">Startdatum</span>
          <span className="sub-grid-value">
            {subscription.startDate
              ? formatDateNl(subscription.startDate)
              : '—'}
          </span>
        </div>
        <div className="sub-grid-item">
          <span className="sub-grid-label">Einddatum</span>
          <span className="sub-grid-value">
            {subscription.endDate ? formatDateNl(subscription.endDate) : '—'}
          </span>
        </div>
        <div
          className="sub-grid-item"
          style={{ gridColumn: '1 / -1', borderBottom: 'none', paddingBottom: 4 }}
        >
          <span className="sub-grid-label">
            Opzegdatum (uiterlijk vóór automatische verlenging)
          </span>
          <span className="sub-grid-value">
            {cancelDate ? formatDateNl(cancelDate) : '—'}{' '}
            <span className="text-muted" style={{ fontSize: 12 }}>
              (30 dagen vóór einddatum)
            </span>
          </span>
        </div>
      </div>

      <div className="sub-renew-row">
        <div>
          <div className="sub-grid-label">Automatisch verlengen</div>
          <span className="text-sm text-muted">
            {subscription.autoRenew
              ? 'Jouw abonnement wordt automatisch met 6 maanden verlengd op de einddatum.'
              : 'Jouw abonnement loopt automatisch af op de einddatum en wordt niet verlengd.'}
          </span>
        </div>
        <label className="toggle-switch" style={{ whiteSpace: 'nowrap' }}>
          <input
            checked={subscription.autoRenew}
            disabled={isPending}
            onChange={event => void onToggleAutoRenew(event.target.checked)}
            type="checkbox"
          />
          <span className="toggle-track" />
          <span className="toggle-label">
            {subscription.autoRenew ? 'Aan' : 'Uit'}
          </span>
        </label>
      </div>

      {showCancelWarning && daysUntilCancel !== null && (
        <SubWarningBanner icon={<TriangleWarningIcon />}>
          De opzegtermijn loopt binnen {daysUntilCancel}{' '}
          {daysUntilCancel === 1 ? 'dag' : 'dagen'} af. Wil je niet automatisch
          verlengen, schakel dan tijdig de toggle uit.
        </SubWarningBanner>
      )}

      {showEndingWarning && subscription.endDate && (
        <SubWarningBanner icon={<CircleWarningIcon />}>
          Je hebt automatisch verlengen uitgeschakeld. Jouw abonnement eindigt
          op {formatDateNl(subscription.endDate)} en wordt daarna niet
          voortgezet.
        </SubWarningBanner>
      )}
    </div>
  )
}
