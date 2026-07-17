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
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-medium text-foreground">
          Abonnementen
        </h1>
        <button
          className={`
            inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5
            text-sm font-semibold text-primary-foreground transition
            hover:bg-primary-hover
          `}
          onClick={() => setIsCreating(true)}
          type="button"
        >
          + Nieuwe abonnement
        </button>
      </div>

      <div
        className={`
          mb-6 grid grid-cols-2 gap-4
          md:grid-cols-4
        `}
      >
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

      <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className={`
              font-serif text-xl font-medium tracking-tight text-foreground
            `}>
              Klantabonnementen
            </h3>
            <p className="text-[13.5px] text-muted-foreground">
              Klik op een rij om het abonnement aan te passen of te starten.
            </p>
          </div>
          <div className="relative w-[280px] max-w-full">
            <svg
              className={`
                pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2
                text-muted-foreground
              `}
              fill="none"
              height="14"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="14"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              className={`
                w-full rounded-md border border-border bg-background py-2 pr-3
                pl-8 text-[13px]
                focus:border-primary focus:outline-none
              `}
              onChange={onSearchChange}
              placeholder="Zoek op klant, e-mail of plan..."
              type="text"
              value={searchText}
            />
          </div>
        </div>
        <div className="-mx-6 -mb-6 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                <th
                  className={`
                    border-b border-border-soft bg-[#FAFBFA] py-3 pr-4 pl-6
                    text-[12px] font-semibold tracking-[0.04em]
                    text-muted-foreground uppercase
                  `}
                >
                  Klant
                </th>
                <th
                  className={`
                    border-b border-border-soft bg-[#FAFBFA] px-4 py-3
                    text-[12px] font-semibold tracking-[0.04em]
                    text-muted-foreground uppercase
                  `}
                >
                  Type
                </th>
                <th
                  className={`
                    border-b border-border-soft bg-[#FAFBFA] px-4 py-3
                    text-right text-[12px] font-semibold tracking-[0.04em]
                    text-muted-foreground uppercase
                  `}
                >
                  Prijs/6 mnd
                </th>
                <th
                  className={`
                    border-b border-border-soft bg-[#FAFBFA] px-4 py-3
                    text-[12px] font-semibold tracking-[0.04em]
                    text-muted-foreground uppercase
                  `}
                >
                  Startdatum
                </th>
                <th
                  className={`
                    border-b border-border-soft bg-[#FAFBFA] px-4 py-3
                    text-[12px] font-semibold tracking-[0.04em]
                    text-muted-foreground uppercase
                  `}
                >
                  Einddatum
                </th>
                <th
                  className={`
                    border-b border-border-soft bg-[#FAFBFA] px-4 py-3
                    text-[12px] font-semibold tracking-[0.04em]
                    text-muted-foreground uppercase
                  `}
                >
                  Opzegdatum
                </th>
                <th
                  className={`
                    border-b border-border-soft bg-[#FAFBFA] px-4 py-3
                    text-[12px] font-semibold tracking-[0.04em]
                    text-muted-foreground uppercase
                  `}
                >
                  Auto-verlengen
                </th>
                <th
                  className={`
                    border-b border-border-soft bg-[#FAFBFA] px-4 py-3
                    text-[12px] font-semibold tracking-[0.04em]
                    text-muted-foreground uppercase
                  `}
                >
                  Status
                </th>
                <th
                  className={`
                    border-b border-border-soft bg-[#FAFBFA] py-3 pr-6 pl-4
                  `}
                />
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(row => (
                <tr
                  className={`
                    border-b border-border-soft
                    last:border-0
                    hover:bg-[#E9EDEB]
                  `}
                  key={row.userId}
                >
                  <td className="py-3 pr-4 pl-6">
                    <div className="font-bold text-foreground">
                      {row.customerName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {row.customerEmail}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {row.plan?.label ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-foreground">
                    {row.price !== null ? formatEuro(row.price) : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.startDate ? formatDateNl(row.startDate) : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.endDate ? formatDateNl(row.endDate) : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.cancelDate ? formatDateNl(row.cancelDate) : '—'}
                  </td>
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3">
                    <SubscriptionStatusBadge status={row.status} />
                  </td>
                  <td className="py-3 pr-6 pl-4 text-right">
                    <button
                      className={`
                        rounded-md border border-border px-3 py-1.5 text-xs
                        font-semibold text-foreground transition
                        hover:bg-border-soft
                      `}
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
