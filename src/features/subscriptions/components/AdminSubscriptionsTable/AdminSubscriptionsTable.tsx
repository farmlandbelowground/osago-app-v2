'use client'

import { useMemo, useState, type ChangeEvent, type FC } from 'react'

import { cn } from '@shared/utils/cn'

import {
  BADGE_KIND_CLASSES,
  BADGE_SHAPE_CLASSES,
  PLANS,
  SUBSCRIPTION_ARR_STATUSES,
} from '../../constants'
import { formatDateNl } from '../../lib/formatDateNl'
import { formatEuro } from '../../lib/formatEuro'
import { subStatus } from '../../lib/subStatus'
import { type CustomerSelectOption } from '../../types'
import { AdminSubscriptionModal } from '../AdminSubscriptionModal'
import { KpiTile } from '../KpiTile'
import { SubscriptionStatusBadge } from '../SubscriptionStatusBadge'
import { type Props } from './types'

export const AdminSubscriptionsTable: FC<Props> = ({ subscriptions }) => {
  const [searchText, setSearchText] = useState('')
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const rows = useMemo(
    () =>
      subscriptions.map(subscription => {
        const plan = PLANS.find(candidate => candidate.id === subscription.type)
        const { cancelDate, status } = subStatus(subscription)

        return { ...subscription, cancelDate, plan, status }
      }),
    [subscriptions],
  )

  const stats = useMemo(() => {
    const arrStatuses = new Set<string>(SUBSCRIPTION_ARR_STATUSES)
    let active = 0
    let ending = 0
    let expired = 0
    let arr = 0

    rows.forEach(row => {
      if (row.status === 'active') {
        active += 1
      }

      if (row.status === 'ending') {
        ending += 1
      }

      if (row.status === 'expired') {
        expired += 1
      }

      if (arrStatuses.has(row.status)) {
        arr += row.price ?? row.plan?.price ?? 0
      }
    })

    return { active, arr, ending, expired, total: rows.length }
  }, [rows])

  const filteredRows = rows.filter(row => {
    const haystack =
      `${row.customerName} ${row.customerEmail} ${row.plan?.label ?? ''}`.toLowerCase()

    return haystack.includes(searchText.trim().toLowerCase())
  })

  const editingRow = rows.find(row => row.userId === editingUserId) ?? null

  const customers: CustomerSelectOption[] = rows.map(row => ({
    label: `${row.customerName} — ${row.customerEmail}`,
    userId: row.userId,
  }))

  const onSearchChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setSearchText(event.target.value)
  }

  const onCloseModal = (): void => {
    setIsCreating(false)
    setEditingUserId(null)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Abonnementen</h1>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-primary"
            onClick={() => setIsCreating(true)}
            type="button"
          >
            + Nieuw abonnement
          </button>
        </div>
      </div>

      <div className="grid-4 mb-5 grid">
        <KpiTile
          label="Actieve abonnementen"
          meta={`${stats.total} klanten totaal`}
          value={String(stats.active)}
        />
        <KpiTile
          label="Loopt binnenkort af"
          meta="Niet automatisch verlengen"
          value={String(stats.ending)}
        />
        <KpiTile
          label="Verlopen"
          meta="Geen actieve dekking"
          value={String(stats.expired)}
        />
        <KpiTile
          label="ARR (jaaromzet)"
          meta="Gebaseerd op actieve plannen"
          value={formatEuro(stats.arr)}
        />
      </div>

      <div className="card">
        <div className="flex-between mb-3" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3>Klantabonnementen</h3>
            <p className="desc" style={{ marginBottom: 0 }}>
              Klik op een rij om het abonnement aan te passen of te starten.
            </p>
          </div>
          <div style={{ position: 'relative', width: 280, maxWidth: '100%' }}>
            <svg
              fill="none"
              height="14"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted)',
                pointerEvents: 'none',
              }}
              viewBox="0 0 24 24"
              width="14"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              onChange={onSearchChange}
              placeholder="Zoek op klant, e-mail of plan..."
              style={{ width: '100%', padding: '8px 12px 8px 32px', fontSize: 13 }}
              type="text"
              value={searchText}
            />
          </div>
        </div>
        <div style={{ overflowX: 'auto', margin: '0 -24px -24px' }}>
          <table style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: 24 }}>Klant</th>
                <th>Type</th>
                <th className="right">Prijs/6 mnd</th>
                <th>Startdatum</th>
                <th>Einddatum</th>
                <th>Opzegdatum</th>
                <th>Auto-verlengen</th>
                <th>Status</th>
                <th className="right" style={{ paddingRight: 24 }} />
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(row => (
                <tr key={row.userId}>
                  <td style={{ paddingLeft: 24 }}>
                    <strong>{row.customerName}</strong>
                    <div className="text-xs text-muted">
                      {row.customerEmail}
                    </div>
                  </td>
                  <td>{row.plan?.label ?? '—'}</td>
                  <td className="right">
                    {row.price !== null ? formatEuro(row.price) : '—'}
                  </td>
                  <td className="text-muted">
                    {row.startDate ? formatDateNl(row.startDate) : '—'}
                  </td>
                  <td className="text-muted">
                    {row.endDate ? formatDateNl(row.endDate) : '—'}
                  </td>
                  <td className="text-muted">
                    {row.cancelDate ? formatDateNl(row.cancelDate) : '—'}
                  </td>
                  <td>
                    <span
                      className={cn(
                        BADGE_SHAPE_CLASSES,
                        row.autoRenew
                          ? BADGE_KIND_CLASSES.success
                          : BADGE_KIND_CLASSES.neutral,
                      )}
                    >
                      {row.autoRenew ? 'Aan' : 'Uit'}
                    </span>
                  </td>
                  <td>
                    <SubscriptionStatusBadge status={row.status} />
                  </td>
                  <td className="right" style={{ paddingRight: 24 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setEditingUserId(row.userId)}
                      type="button"
                    >
                      {row.status === 'none' ? 'Activeren' : 'Beheren'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(isCreating || editingRow) && (
        <AdminSubscriptionModal
          customers={customers}
          onClose={onCloseModal}
          subscription={editingRow}
        />
      )}
    </div>
  )
}
