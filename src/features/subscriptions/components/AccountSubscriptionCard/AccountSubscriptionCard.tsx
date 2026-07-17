'use client'

import Link from 'next/link'
import { useState, type FC, type ReactNode } from 'react'

import { useToastStore } from '@shared/store/toast'
import { cn } from '@shared/utils/cn'

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
    className="h-[22px] w-[22px]"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M12 2 15 8h6l-5 4 2 7-6-4-6 4 2-7-5-4h6z" />
  </svg>
)

const ArrowRightIcon: FC = () => (
  <svg
    className="ml-1 inline h-[13px] w-[13px] align-[-2px]"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)

const TriangleWarningIcon: FC = () => (
  <svg
    className="mt-px h-4 w-4 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" x2="12" y1="9" y2="13" />
    <line x1="12" x2="12.01" y1="17" y2="17" />
  </svg>
)

const CircleWarningIcon: FC = () => (
  <svg
    className="mt-px h-4 w-4 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
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
  <div
    className={`
      mt-3.5 flex items-start gap-2.5 rounded-sm border border-[#FCD34D]
      bg-[#FEF3C7] px-3.5 py-2.5 text-[13px] text-[#92400E]
    `}
  >
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
      <div
        className={`
          mb-6 rounded-lg border border-border bg-surface p-6 shadow-sm
        `}
      >
        <h2
          className={`
            mb-1 font-serif text-xl font-medium tracking-[-0.01em]
            text-foreground
          `}
        >
          Mijn abonnement
        </h2>
        <p className="text-[13.5px] text-muted-foreground">
          {isExpired
            ? 'Jouw vorige abonnement is verlopen. Sluit een nieuw abonnement af om weer volledig toegang te krijgen.'
            : 'Je hebt nog geen actief abonnement. Sluit een abonnement af om volledige toegang te krijgen tot alle Osago functies.'}
        </p>
        <div
          className={`
            mt-4 flex items-center gap-3.5 rounded-md border border-primary
            bg-gradient-to-br from-primary-soft to-white p-4
          `}
        >
          <div
            className={`
              flex h-11 w-11 shrink-0 items-center justify-center rounded-md
              bg-primary text-white
            `}
          >
            <StarIcon />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 font-semibold text-foreground">
              Kies een passend abonnement
            </div>
            <div className="text-[13px] text-muted-foreground">
              Vijf plannen vanaf {formatEuro(MIN_PLAN_PRICE)} per 6 maanden.
            </div>
          </div>
          <Link
            className={`
              inline-flex shrink-0 items-center justify-center rounded-md
              bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground
              transition
              hover:-translate-y-px hover:bg-primary-hover
              hover:shadow-[0_4px_12px_rgba(0,179,60,0.25)]
            `}
            href={ABONNEMENT_AFSLUITEN_PATH}
          >
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
    <div
      className={`mb-6 rounded-lg border border-border bg-surface p-6 shadow-sm`}
    >
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            className={`
              mb-0.5 font-serif text-xl font-medium tracking-[-0.01em]
              text-foreground
            `}
          >
            Mijn abonnement
          </h2>
          <p className="text-[13.5px] text-muted-foreground">
            Beheer hier jouw abonnement op Osago.
          </p>
        </div>
        <SubscriptionStatusBadge status={status} />
      </div>

      <div className="mt-3.5 mb-2 grid grid-cols-2 gap-x-7 gap-y-3.5">
        <div
          className={`flex flex-col gap-0.5 border-b border-border-soft py-2.5`}
        >
          <span
            className={`
              text-[11px] font-semibold tracking-[0.05em] text-muted-foreground
              uppercase
            `}
          >
            Type abonnement
          </span>
          <span className="text-sm text-foreground tabular-nums">
            <strong className="font-semibold">
              {plan?.label ?? subscription.type}
            </strong>
          </span>
        </div>
        <div
          className={`flex flex-col gap-0.5 border-b border-border-soft py-2.5`}
        >
          <span
            className={`
              text-[11px] font-semibold tracking-[0.05em] text-muted-foreground
              uppercase
            `}
          >
            Prijs per 6 maanden
          </span>
          <span className="text-sm text-foreground tabular-nums">
            <strong className="font-semibold">{formatEuro(price)}</strong>
          </span>
        </div>
        <div
          className={`flex flex-col gap-0.5 border-b border-border-soft py-2.5`}
        >
          <span
            className={`
              text-[11px] font-semibold tracking-[0.05em] text-muted-foreground
              uppercase
            `}
          >
            Startdatum
          </span>
          <span className="text-sm text-foreground tabular-nums">
            {subscription.startDate
              ? formatDateNl(subscription.startDate)
              : '—'}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 py-2.5">
          <span
            className={`
              text-[11px] font-semibold tracking-[0.05em] text-muted-foreground
              uppercase
            `}
          >
            Einddatum
          </span>
          <span className="text-sm text-foreground tabular-nums">
            {subscription.endDate ? formatDateNl(subscription.endDate) : '—'}
          </span>
        </div>
        <div className="col-span-2 flex flex-col gap-0.5 pb-1">
          <span
            className={`
              text-[11px] font-semibold tracking-[0.05em] text-muted-foreground
              uppercase
            `}
          >
            Opzegdatum (uiterlijk vóór automatische verlenging)
          </span>
          <span className="text-sm text-foreground tabular-nums">
            {cancelDate ? formatDateNl(cancelDate) : '—'}{' '}
            <span className="text-[12px] text-muted-foreground">
              (30 dagen vóór einddatum)
            </span>
          </span>
        </div>
      </div>

      <div
        className={`
          mt-1.5 flex items-center justify-between gap-3.5 border-t
          border-border-soft pt-3.5 pb-1
        `}
      >
        <div>
          <div
            className={`
              mb-px text-[11px] font-semibold tracking-[0.05em]
              text-muted-foreground uppercase
            `}
          >
            Automatisch verlengen
          </div>
          <span className="text-[13px] text-muted-foreground">
            {subscription.autoRenew
              ? 'Jouw abonnement wordt automatisch met 6 maanden verlengd op de einddatum.'
              : 'Jouw abonnement loopt automatisch af op de einddatum en wordt niet verlengd.'}
          </span>
        </div>
        <button
          aria-checked={subscription.autoRenew}
          className={`
            inline-flex shrink-0 items-center gap-2.5 text-[13px]
            text-foreground-secondary
            disabled:opacity-50
          `}
          disabled={isPending}
          onClick={() => void onToggleAutoRenew(!subscription.autoRenew)}
          role="switch"
          type="button"
        >
          <span
            className={cn(
              'relative h-5 w-9 shrink-0 rounded-full transition-colors',
              subscription.autoRenew ? 'bg-primary' : 'bg-border',
            )}
          >
            <span
              className={cn(
                `
                  absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm
                  transition-[left]
                `,
                subscription.autoRenew ? 'left-[18px]' : 'left-0.5',
              )}
            />
          </span>
          <span className="font-medium">
            {subscription.autoRenew ? 'Aan' : 'Uit'}
          </span>
        </button>
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
