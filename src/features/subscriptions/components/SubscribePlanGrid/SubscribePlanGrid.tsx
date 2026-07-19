import Link from 'next/link'
import { type FC } from 'react'

import { cn } from '@shared/utils/cn'

import { ABONNEMENT_AFSLUITEN_PATH, PLANS } from '../../constants'
import { formatEuro } from '../../lib/formatEuro'
import { type Plan } from '../../types'
import { type Props } from './types'

const buildPlanHref = (basePath: string, planId: Plan['id']): string =>
  `${basePath}${basePath.includes('?') ? '&' : '?'}plan=${planId}`

interface PlanCardProps {
  basePath: string
  plan: Plan
}

const PlanCard: FC<PlanCardProps> = ({ basePath, plan }) => (
  <div className={cn('plan-card', plan.featured && 'featured')}>
    <div className="plan-name">{plan.cardLabel ?? plan.label}</div>
    <p className="plan-desc">{plan.desc}</p>

    <div className="plan-price">
      <span className="plan-price-amount">{formatEuro(plan.price)}</span>
    </div>
    <div className="plan-price-meta">{plan.priceMeta}</div>

    <ul className="plan-features">
      {plan.features.map(feature => (
        <li
          className={cn(!feature.included && 'muted')}
          key={feature.text}
        >
          {feature.included ? (
            <svg
              fill="none"
              height="15"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
              width="15"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              fill="none"
              height="15"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="15"
            >
              <line x1="18" x2="6" y1="6" y2="18" />
              <line x1="6" x2="18" y1="6" y2="18" />
            </svg>
          )}
          <span>{feature.text}</span>
        </li>
      ))}
    </ul>

    <div className="plan-cta">
      <Link
        className={cn('btn', plan.featured ? 'btn-primary' : 'btn-secondary')}
        href={buildPlanHref(basePath, plan.id)}
      >
        {plan.ctaLabel}
        <svg
          fill="none"
          height="13"
          stroke="currentColor"
          strokeWidth="2"
          style={{ marginLeft: 4, verticalAlign: -2 }}
          viewBox="0 0 24 24"
          width="13"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  </div>
)

export const SubscribePlanGrid: FC<Props> = ({
  basePath = ABONNEMENT_AFSLUITEN_PATH,
  category,
}) => {
  const fullPlans = PLANS.filter(plan => plan.category === 'full')
  const valuationPlans = PLANS.filter(plan => plan.category === 'valuation')

  if (category) {
    const plans = category === 'full' ? fullPlans : valuationPlans

    return (
      <div className="plans-grid">
        {plans.map(plan => (
          <PlanCard basePath={basePath} key={plan.id} plan={plan} />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Kies jouw abonnement</h1>
        </div>
      </div>

      <div className="plans-grid">
        {fullPlans.map(plan => (
          <PlanCard basePath={basePath} key={plan.id} plan={plan} />
        ))}
      </div>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
        <h2 className="serif" style={{ fontSize: 22, margin: '0 0 4px' }}>
          Alleen Waardebepaling
        </h2>
        <p className="text-muted text-sm" style={{ margin: '0 0 16px' }}>
          Heb je alleen een waardering nodig? Kies een van de losse opties
          hieronder — zonder verkoopbegeleiding of kopermatching.
        </p>
      </div>

      <div className="plans-grid">
        {valuationPlans.map(plan => (
          <PlanCard basePath={basePath} key={plan.id} plan={plan} />
        ))}
      </div>

      <div className="alert alert-info" style={{ marginTop: 32 }}>
        <strong>Geen verrassingen.</strong> Jouw abonnement loopt 6 maanden. Je
        kunt tot 30 dagen vóór de einddatum opzeggen — daarna verlengt het
        automatisch tegen hetzelfde tarief.
      </div>
    </div>
  )
}
