import { type FC } from 'react'

import { formatDateNl } from '../../lib/formatDateNl'
import { formatEuro } from '../../lib/formatEuro'
import { InvoiceStatusBadge } from '../InvoiceStatusBadge'
import { type Props } from './types'

export const AccountInvoicesTable: FC<Props> = ({ invoices }) => {
  return (
    <div
      className={`mb-6 rounded-lg border border-border bg-surface p-6 shadow-sm`}
    >
      <h2 className="mb-1 font-serif text-xl font-medium text-foreground">
        Facturen
      </h2>
      <p className="mb-5 text-[13.5px] text-muted-foreground">
        Overzicht van jouw facturen van Osago. Klik op &quot;Betalen&quot; om
        een openstaande factuur direct te voldoen.
      </p>

      {invoices.length === 0 ? (
        <div
          className={`
            rounded-md border border-border bg-background px-6 py-10 text-center
          `}
        >
          <h3 className="mb-1 text-sm font-semibold text-foreground">
            Nog geen facturen
          </h3>
          <p className="text-xs text-muted-foreground">
            Zodra Osago een factuur voor je opstelt, verschijnt deze hier.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr
                className={`
                  border-b border-border text-xs text-muted-foreground
                `}
              >
                <th className="py-2 pr-3 font-medium">Factuurnr.</th>
                <th className="py-2 pr-3 font-medium">Datum</th>
                <th className="py-2 pr-3 font-medium">Omschrijving</th>
                <th className="py-2 pr-3 text-right font-medium">Bedrag</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {invoices.map(invoice => {
                const canPay =
                  invoice.status === 'issued' &&
                  invoice.paymentUrl !== null &&
                  !invoice.isCreditNote

                return (
                  <tr
                    className={`
                      border-b border-border-soft
                      last:border-0
                    `}
                    key={invoice.id}
                  >
                    <td className="py-3 pr-3 font-medium text-foreground">
                      {invoice.number}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {invoice.issuedAt || invoice.createdAt
                        ? formatDateNl(
                            (invoice.issuedAt ?? invoice.createdAt) as string,
                          )
                        : '—'}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {invoice.description || invoice.period}
                      {invoice.dueAt && (
                        <div className="text-xs text-muted-foreground-soft">
                          Vervaldatum: {formatDateNl(invoice.dueAt)}
                        </div>
                      )}
                    </td>
                    <td
                      className={`
                        py-3 pr-3 text-right font-medium text-foreground
                      `}
                    >
                      {invoice.grossValue !== null
                        ? formatEuro(invoice.grossValue)
                        : '—'}
                    </td>
                    <td className="py-3 pr-3">
                      <InvoiceStatusBadge invoice={invoice} />
                    </td>
                    <td className="py-3 text-right">
                      {canPay && invoice.paymentUrl && (
                        <a
                          className={`
                            inline-flex items-center justify-center rounded-md
                            bg-primary px-3 py-1.5 text-xs font-semibold
                            text-primary-foreground transition
                            hover:bg-primary-hover
                          `}
                          href={invoice.paymentUrl}
                        >
                          Betalen
                        </a>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
