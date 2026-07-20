import Link from 'next/link'
import { type FC } from 'react'

import { ABONNEMENT_AFSLUITEN_PATH, PLANS } from '../../constants'
import { formatDateNl } from '../../lib/formatDateNl'
import { formatEuro } from '../../lib/formatEuro'
import { isOverdueInvoice } from '../../lib/lockStatus'
import { type Props } from './types'

const WarningIcon: FC = () => (
  <svg
    fill="none"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="24"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
)

export const AccountBlockedBanner: FC<Props> = ({
  invoices,
  lockReason,
  subscription,
}) => {
  if (!lockReason) {
    return null
  }

  if (lockReason === 'expired') {
    const plan = PLANS.find(candidate => candidate.id === subscription?.type)

    return (
      <div
        className="card mb-5"
        style={{ borderLeft: '4px solid #B91C1C', background: '#FEF2F2' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flexShrink: 0, color: '#B91C1C' }}>
            <WarningIcon />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ color: '#7f1d1d', margin: '0 0 4px 0' }}>
              Je account is beperkt
            </h3>
            <p style={{ margin: 0, color: '#7f1d1d', lineHeight: 1.5 }}>
              {plan && subscription?.endDate
                ? `Je ${plan.label}-abonnement is verlopen op ${formatDateNl(subscription.endDate)}.`
                : 'Je abonnement is verlopen.'}{' '}
              Zolang je abonnement niet is verlengd, kun je alleen &quot;Mijn
              account&quot; bereiken. Zodra je nieuwe betaling binnen is bij
              Mollie krijg je meteen weer volledige toegang.
            </p>
          </div>
        </div>
        <div
          style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}
        >
          <Link className="btn btn-primary" href={ABONNEMENT_AFSLUITEN_PATH}>
            Verleng abonnement
          </Link>
        </div>
      </div>
    )
  }

  const overdueInvoices = invoices.filter(isOverdueInvoice)

  return (
    <div
      className="card mb-5"
      style={{ borderLeft: '4px solid #B91C1C', background: '#FEF2F2' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flexShrink: 0, color: '#B91C1C' }}>
          <WarningIcon />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ color: '#7f1d1d', margin: '0 0 4px 0' }}>
            Je account is beperkt
          </h3>
          <p style={{ margin: 0, color: '#7f1d1d', lineHeight: 1.5 }}>
            Er staat een vervallen factuur open. Zolang deze niet betaald is,
            kun je alleen &quot;Mijn account&quot; bereiken. Zodra je betaling
            binnen is bij Mollie krijg je meteen weer volledige toegang.
          </p>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        {overdueInvoices.map(invoice => (
          <div
            key={invoice.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 0',
              borderTop: '1px solid rgba(185,28,28,0.15)',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>
                {invoice.number || '—'} ·{' '}
                {invoice.description || invoice.period || ''}
              </div>
              <div className="text-xs" style={{ color: '#7f1d1d' }}>
                Verlopen op {invoice.dueAt ? formatDateNl(invoice.dueAt) : '—'}
                {invoice.grossValue !== null &&
                  ` · ${formatEuro(invoice.grossValue)}`}
              </div>
            </div>
            {invoice.paymentUrl && (
              <a
                className="btn btn-primary btn-sm"
                href={invoice.paymentUrl}
                rel="noopener"
                style={{ textDecoration: 'none', flexShrink: 0 }}
                target="_blank"
              >
                Betaal nu
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
