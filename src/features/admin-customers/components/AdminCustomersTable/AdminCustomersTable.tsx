'use client'

import { useState, type FC } from 'react'

import { ImpersonateButton } from '@features/impersonation'
import {
  BADGE_KIND_CLASSES,
  BADGE_SHAPE_CLASSES,
} from '@features/subscriptions/constants'
import { formatEuro } from '@features/subscriptions/lib/formatEuro'
import { cn } from '@shared/utils/cn'

import { formatCustomerDate } from '../../lib/format'
import { type AdminCustomerRow } from '../../types'
import { AdminNewCustomerModal } from '../AdminNewCustomerModal'
import { AdminSearchInput } from '../AdminSearchInput'
import { CustomerOverviewModal } from '../CustomerOverviewModal'
import { type Props } from './types'

export const AdminCustomersTable: FC<Props> = ({ customers }) => {
  const [search, setSearch] = useState('')
  const [overview, setOverview] = useState<AdminCustomerRow | null>(null)
  const [isNewOpen, setIsNewOpen] = useState(false)

  const query = search.trim().toLowerCase()
  const visible = query
    ? customers.filter(customer =>
        [customer.name, customer.email, customer.company, customer.customerId]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query),
      )
    : customers

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Klantenoverzicht</h1>
        </div>
        <div className="page-actions" style={{ flexWrap: 'wrap', gap: 8 }}>
          <AdminSearchInput
            onChange={setSearch}
            placeholder="Zoek op klant, bedrijf of e-mail…"
            value={search}
          />
          <button
            className="btn btn-primary"
            onClick={() => setIsNewOpen(true)}
            type="button"
          >
            Nieuwe klant
          </button>
        </div>
      </div>

      <div
        className="card-tight"
        style={{
          background: '#fff',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        <table>
          <thead>
            <tr>
              <th>Klant</th>
              <th>Bedrijfsnaam</th>
              <th>Datum geregistreerd</th>
              <th>Lopend abonnement</th>
              <th className="right">Omzet</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visible.map(customer => (
              <tr key={customer.id}>
                <td>
                  <strong>{customer.name}</strong>
                  <div className="text-xs text-muted">{customer.email}</div>
                </td>
                <td>{customer.company || '—'}</td>
                <td className="text-muted">
                  {formatCustomerDate(customer.createdAt)}
                </td>
                <td>
                  {customer.planLabel ? (
                    <>
                      <strong>{customer.planLabel}</strong>
                      <div className="text-xs">
                        <span
                          className={cn(
                            BADGE_SHAPE_CLASSES,
                            BADGE_KIND_CLASSES[customer.statusKind],
                          )}
                        >
                          {customer.statusLabel}
                        </span>
                      </div>
                    </>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="right">
                  {customer.omzet > 0 ? (
                    formatEuro(customer.omzet)
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="right">
                  <div
                    style={{
                      display: 'inline-flex',
                      flexWrap: 'wrap',
                      gap: 6,
                      justifyContent: 'flex-end',
                    }}
                  >
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setOverview(customer)}
                      type="button"
                    >
                      Bekijken
                    </button>
                    <ImpersonateButton
                      className="btn btn-secondary btn-sm"
                      customerName={customer.name}
                      label="Inloggen als klant"
                      userId={customer.id}
                      withIcon
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {overview && (
        <CustomerOverviewModal
          customerName={overview.name}
          onClose={() => setOverview(null)}
          userId={overview.id}
        />
      )}
      {isNewOpen && (
        <AdminNewCustomerModal onClose={() => setIsNewOpen(false)} />
      )}
    </>
  )
}
