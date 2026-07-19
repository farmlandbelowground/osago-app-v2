import { type FC } from 'react'

import { formatDateNl } from '../../lib/formatDateNl'
import { formatEuro } from '../../lib/formatEuro'
import { InvoiceStatusBadge } from '../InvoiceStatusBadge'
import { type Props } from './types'

export const AccountInvoicesTable: FC<Props> = ({ invoices }) => {
  return (
    <div className="card mb-5">
      <div
        className="mb-3"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h3>Facturen</h3>
          <p className="desc" style={{ marginBottom: 0 }}>
            Overzicht van jouw facturen van Osago. Klik op &quot;Betalen&quot;
            om een openstaande factuur direct te voldoen.
          </p>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="empty" style={{ padding: '36px 20px' }}>
          <div className="empty-icon">
            <svg
              fill="none"
              height="24"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="24"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="9" x2="15" y1="13" y2="13" />
              <line x1="9" x2="15" y1="17" y2="17" />
            </svg>
          </div>
          <h3>Nog geen facturen</h3>
          <p>Zodra Osago een factuur voor je opstelt, verschijnt deze hier.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', margin: '0 -24px -24px' }}>
          <table style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: 24 }}>Factuurnr.</th>
                <th>Datum</th>
                <th>Omschrijving</th>
                <th className="right">Bedrag</th>
                <th>Status</th>
                <th className="right" style={{ paddingRight: 24 }} />
              </tr>
            </thead>
            <tbody>
              {invoices.map(invoice => {
                const canPay =
                  invoice.status === 'issued' &&
                  invoice.paymentUrl !== null &&
                  !invoice.isCreditNote
                const dateSrc = invoice.issuedAt ?? invoice.createdAt

                return (
                  <tr key={invoice.id}>
                    <td style={{ paddingLeft: 24 }}>
                      <strong>{invoice.number || '—'}</strong>
                    </td>
                    <td className="text-muted">
                      {dateSrc ? formatDateNl(dateSrc) : '—'}
                    </td>
                    <td>
                      {invoice.description || invoice.period || '—'}
                      {invoice.dueAt && (
                        <div className="text-xs text-muted">
                          Vervaldatum: {formatDateNl(invoice.dueAt)}
                        </div>
                      )}
                    </td>
                    <td className="right">
                      <strong>
                        {invoice.grossValue !== null
                          ? formatEuro(invoice.grossValue)
                          : '—'}
                      </strong>
                    </td>
                    <td>
                      <InvoiceStatusBadge invoice={invoice} />
                    </td>
                    <td
                      className="right"
                      style={{ paddingRight: 24, whiteSpace: 'nowrap' }}
                    >
                      {canPay && invoice.paymentUrl && (
                        <a
                          className="btn btn-primary btn-sm"
                          href={invoice.paymentUrl}
                          style={{ textDecoration: 'none' }}
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
