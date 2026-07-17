import Link from 'next/link'
import { type FC } from 'react'

import { ABONNEMENT_AFSLUITEN_PATH, PLANS } from '../../constants'
import { formatDateNl } from '../../lib/formatDateNl'
import { formatEuro } from '../../lib/formatEuro'
import { isOverdueInvoice } from '../../lib/lockStatus'
import { type Props } from './types'

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
        className={`
          mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-5
        `}
      >
        <h3 className="mb-1.5 font-serif text-lg font-medium text-foreground">
          Je account is beperkt
        </h3>
        <p
          className={`
            mb-4 text-[13.5px] leading-relaxed text-foreground-secondary
          `}
        >
          {plan && subscription?.endDate && (
            <>
              Je {plan.label}-abonnement is verlopen op{' '}
              {formatDateNl(subscription.endDate)}.{' '}
            </>
          )}
          Zolang je abonnement niet is verlengd, kun je alleen &quot;Mijn
          account&quot; bereiken. Zodra je nieuwe betaling binnen is bij Mollie
          krijg je meteen weer volledige toegang.
        </p>
        <Link
          className={`
            inline-flex items-center justify-center rounded-md bg-primary px-4
            py-2.5 text-sm font-semibold text-primary-foreground transition
            hover:bg-primary-hover
          `}
          href={ABONNEMENT_AFSLUITEN_PATH}
        >
          Verleng abonnement
        </Link>
      </div>
    )
  }

  const overdueInvoices = invoices.filter(isOverdueInvoice)

  return (
    <div
      className={`
        mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-5
      `}
    >
      <h3 className="mb-1.5 font-serif text-lg font-medium text-foreground">
        Je account is beperkt
      </h3>
      <p
        className={`
          mb-4 text-[13.5px] leading-relaxed text-foreground-secondary
        `}
      >
        Er staat een vervallen factuur open. Zolang deze niet betaald is, kun je
        alleen &quot;Mijn account&quot; bereiken. Zodra je betaling binnen is
        bij Mollie krijg je meteen weer volledige toegang.
      </p>
      <ul className="flex flex-col gap-2">
        {overdueInvoices.map(invoice => (
          <li
            className={`
              flex flex-wrap items-center justify-between gap-3 rounded-md
              border border-border bg-surface px-4 py-3
            `}
            key={invoice.id}
          >
            <div>
              <div className="text-sm font-semibold text-foreground">
                {invoice.number} · {invoice.description || invoice.period}
              </div>
              <div className="text-xs text-muted-foreground">
                {invoice.dueAt && `Verlopen op ${formatDateNl(invoice.dueAt)}`}
                {invoice.grossValue !== null &&
                  ` · ${formatEuro(invoice.grossValue)}`}
              </div>
            </div>
            {invoice.paymentUrl && (
              <a
                className={`
                  inline-flex items-center justify-center rounded-md bg-primary
                  px-3.5 py-2 text-sm font-semibold text-primary-foreground
                  transition
                  hover:bg-primary-hover
                `}
                href={invoice.paymentUrl}
              >
                Betaal nu
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
