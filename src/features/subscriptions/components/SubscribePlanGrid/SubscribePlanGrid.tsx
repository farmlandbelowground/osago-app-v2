import Link from 'next/link'
import { type FC } from 'react'

import { cn } from '@shared/utils/cn'

import { ABONNEMENT_AFSLUITEN_PATH, PLANS } from '../../constants'
import { formatEuro } from '../../lib/formatEuro'
import { type Plan } from '../../types'

const buildPlanHref = (planId: Plan['id']): string =>
  `${ABONNEMENT_AFSLUITEN_PATH}?plan=${planId}`

interface PlanCardProps {
  plan: Plan
}

const PlanCard: FC<PlanCardProps> = ({ plan }) => (
  <div
    className={cn(
      'flex flex-col rounded-lg border bg-surface p-6',
      plan.featured ? 'border-primary shadow-md' : 'border-border',
    )}
  >
    {plan.featured && (
      <span
        className={`
          mb-3 inline-flex w-fit items-center rounded-full bg-primary-soft
          px-2.5 py-1 text-[11px] font-semibold text-primary-hover uppercase
        `}
      >
        Meest gekozen
      </span>
    )}
    <h3 className="font-serif text-lg font-medium text-foreground">
      {plan.cardLabel ?? plan.label}
    </h3>
    <p className="mb-3 text-[13px] text-muted-foreground">{plan.desc}</p>
    <div className="mb-4">
      <span className="font-serif text-2xl font-medium text-foreground">
        {formatEuro(plan.price)}
      </span>{' '}
      <span className="text-xs text-muted-foreground">{plan.priceMeta}</span>
    </div>
    <ul
      className={`
        mb-5 flex flex-1 flex-col gap-1.5 text-[13px] text-foreground-secondary
      `}
    >
      {plan.features.map(feature => (
        <li className="flex items-start gap-1.5" key={feature.text}>
          <span aria-hidden="true" className="text-primary">
            ✓
          </span>
          {feature.text}
        </li>
      ))}
    </ul>
    <Link
      className={cn(
        `
          inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm
          font-semibold transition
        `,
        plan.featured
          ? `
            bg-primary text-primary-foreground
            hover:bg-primary-hover
          `
          : `
            bg-muted text-foreground
            hover:bg-border-soft
          `,
      )}
      href={buildPlanHref(plan.id)}
    >
      {plan.ctaLabel}
    </Link>
  </div>
)

export const SubscribePlanGrid: FC = () => {
  const fullPlans = PLANS.filter(plan => plan.category === 'full')
  const valuationPlans = PLANS.filter(plan => plan.category === 'valuation')

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-medium text-foreground">
        Kies jouw abonnement
      </h1>
      <div
        className={`
          mb-10 grid grid-cols-1 gap-5
          md:grid-cols-3
        `}
      >
        {fullPlans.map(plan => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>

      <h2 className="mb-1 font-serif text-xl font-medium text-foreground">
        Alleen Waardebepaling
      </h2>
      <p className="mb-6 text-[13.5px] text-muted-foreground">
        Heb je alleen een waardering nodig? Kies een van de losse opties
        hieronder — zonder verkoopbegeleiding of kopermatching.
      </p>
      <div
        className={`
          mb-10 grid grid-cols-1 gap-5
          md:grid-cols-2
        `}
      >
        {valuationPlans.map(plan => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>

      <div
        className={`
          rounded-md border border-info/30 bg-info/10 px-5 py-4 text-[13.5px]
          text-info
        `}
      >
        <strong className="font-semibold">Geen verrassingen.</strong> Jouw
        abonnement loopt 6 maanden. Je kunt tot 30 dagen vóór de einddatum
        opzeggen — daarna verlengt het automatisch tegen hetzelfde tarief.
      </div>
    </div>
  )
}
