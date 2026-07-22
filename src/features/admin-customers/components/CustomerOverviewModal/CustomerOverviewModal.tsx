'use client'

import { useEffect, useState, type FC, type ReactNode } from 'react'

import { ImpersonateButton } from '@features/impersonation'
import {
  BADGE_KIND_CLASSES,
  BADGE_SHAPE_CLASSES,
} from '@features/subscriptions/constants'
import { formatEuro } from '@features/subscriptions/lib/formatEuro'
import { ModalShell } from '@shared/components/ModalShell'
import { cn } from '@shared/utils/cn'

import { loadCustomerOverview } from '../../actions'
import { formatCustomerDate } from '../../lib/format'
import { type CustomerOverview } from '../../types'
import { type Props } from './types'

// Read-only "Bekijken" overview (openCustomerOverviewModal, D-A): Klantgegevens /
// Contactgegevens / Projecten (N) / Facturen (N). Fetches on open so the Klanten
// table keeps its search state.
export const CustomerOverviewModal: FC<Props> = ({
  customerName,
  onClose,
  userId,
}) => {
  const [overview, setOverview] = useState<CustomerOverview | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    void loadCustomerOverview(userId).then(result => {
      if (isActive) {
        setOverview(result)
        setIsLoading(false)
      }
    })

    return () => {
      isActive = false
    }
  }, [userId])

  const footer = (
    <>
      <button className="btn btn-secondary" onClick={onClose} type="button">
        Sluiten
      </button>
      <ImpersonateButton
        className="btn btn-primary"
        customerName={customerName}
        label="Inloggen als klant"
        userId={userId}
        withIcon
      />
    </>
  )

  const field = (label: string, value: ReactNode): ReactNode => (
    <div>
      <div
        className="text-xs text-muted fw-600"
        style={{ letterSpacing: '0.05em', textTransform: 'uppercase' }}
      >
        {label}
      </div>
      <div style={{ marginTop: 4 }}>{value}</div>
    </div>
  )

  return (
    <ModalShell
      footer={footer}
      maxWidthClassName="modal-lg"
      onClose={onClose}
      title={`Klant — ${customerName}`}
    >
      {isLoading || !overview ? (
        <p className="text-muted">Klantgegevens laden…</p>
      ) : (
        <>
          <h4 className="serif" style={{ fontSize: 17, margin: '0 0 8px' }}>
            Klantgegevens
          </h4>
          <div className="grid-2 grid" style={{ fontSize: 13, gap: 12 }}>
            {field(
              'Klant ID',
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                {overview.customerId ?? '—'}
              </span>,
            )}
            {field('Bedrijfsnaam', overview.companyName)}
            {field(
              'Adres',
              overview.addressLines.length > 0
                ? overview.addressLines.map(line => (
                    <div key={line}>{line}</div>
                  ))
                : '—',
            )}
          </div>

          <div className="divider" />

          <h4 className="serif" style={{ fontSize: 17, margin: '0 0 8px' }}>
            Contactgegevens
          </h4>
          <div className="grid-2 grid" style={{ fontSize: 13, gap: 12 }}>
            {field('Voornaam', overview.firstName || '—')}
            {field('Achternaam', overview.lastName || '—')}
            {field('E-mail', overview.email)}
            {field('Telefoonnummer', overview.phone || '—')}
          </div>

          <div className="divider" />

          <h4 className="serif" style={{ fontSize: 17, margin: '0 0 8px' }}>
            Projecten ({overview.projects.length})
          </h4>
          {overview.projects.length === 0 ? (
            <p className="text-muted text-sm">Nog geen project gekoppeld.</p>
          ) : (
            <table style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Project ID</th>
                  <th>Type</th>
                  <th>Bedrijfsnaam</th>
                  <th>Sector</th>
                </tr>
              </thead>
              <tbody>
                {overview.projects.map(project => (
                  <tr key={project.projectId}>
                    <td style={{ fontFamily: 'monospace' }}>
                      {project.projectId}
                    </td>
                    <td>{project.typeLabel}</td>
                    <td>{project.name}</td>
                    <td>{project.sector}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="divider" />

          <h4 className="serif" style={{ fontSize: 17, margin: '0 0 8px' }}>
            Facturen ({overview.invoices.length})
          </h4>
          {overview.invoices.length === 0 ? (
            <p className="text-muted text-sm">Nog geen facturen.</p>
          ) : (
            <table style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Nummer</th>
                  <th>Datum</th>
                  <th>Omschrijving</th>
                  <th className="right">Bedrag</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {overview.invoices.map(invoice => (
                  <tr key={invoice.id}>
                    <td style={{ fontFamily: 'monospace' }}>
                      {invoice.number || '—'}
                    </td>
                    <td className="text-muted">
                      {formatCustomerDate(invoice.issuedAt)}
                    </td>
                    <td>{invoice.description || '—'}</td>
                    <td className="right">{formatEuro(invoice.amount)}</td>
                    <td>
                      <span
                        className={cn(
                          BADGE_SHAPE_CLASSES,
                          BADGE_KIND_CLASSES[invoice.statusKind],
                        )}
                      >
                        {invoice.statusLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </ModalShell>
  )
}
