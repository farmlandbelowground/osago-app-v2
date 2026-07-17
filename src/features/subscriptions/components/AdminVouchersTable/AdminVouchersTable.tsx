'use client'

import { useMemo, useState, type FC, type SVGProps } from 'react'

import { cn } from '@shared/utils/cn'

import { deleteVoucher } from '../../actions'
import { PLANS, VOUCHER_APPLIES_TO_ALL } from '../../constants'
import { formatDateNl } from '../../lib/formatDateNl'
import { formatEuro } from '../../lib/formatEuro'
import { voucherStatus } from '../../lib/voucherStatus'
import { type Voucher } from '../../types'
import { AdminVoucherModal } from '../AdminVoucherModal'
import { KpiTile } from '../KpiTile'
import { VoucherStatusBadge } from '../VoucherStatusBadge'
import { type Props } from './types'

const TrashIcon: FC<SVGProps<SVGSVGElement>> = props => (
  <svg
    fill="none"
    height="14"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="14"
    {...props}
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
)

const TH_CLASSES = `
  border-b border-border-soft bg-background px-4 py-3 text-[12px]
  font-semibold tracking-[0.04em] text-muted-foreground uppercase
`
const TD_CLASSES = 'border-b border-border-soft px-4 py-3 text-[13.5px]'

export const AdminVouchersTable: FC<Props> = ({ vouchers }) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const sortedVouchers = useMemo(
    () =>
      [...vouchers].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [vouchers],
  )

  const stats = useMemo(() => {
    let active = 0
    let expiredOrDepleted = 0
    let totalUsed = 0

    sortedVouchers.forEach(voucher => {
      const status = voucherStatus(voucher)

      if (status === 'active') {
        active += 1
      }

      if (status === 'expired' || status === 'depleted') {
        expiredOrDepleted += 1
      }

      totalUsed += voucher.usedCount
    })

    return {
      active,
      expiredOrDepleted,
      total: sortedVouchers.length,
      totalUsed,
    }
  }, [sortedVouchers])

  const editingVoucher =
    vouchers.find(voucher => voucher.id === editingId) ?? null

  const onDelete = async (voucher: Voucher): Promise<void> => {
    const confirmMessage =
      voucher.usedCount > 0
        ? `Deze voucher is al ${voucher.usedCount} keer gebruikt. Verwijderen verbreekt de koppeling met bestaande facturen. Weet je het zeker?`
        : 'Weet je zeker dat je deze vouchercode wilt verwijderen?'

    if (!window.confirm(confirmMessage)) {
      return
    }

    await deleteVoucher(voucher.id)
  }

  const onCloseModal = (): void => {
    setIsCreating(false)
    setEditingId(null)
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-medium text-foreground">
          Vouchers
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
          + Nieuwe vouchercode
        </button>
      </div>

      <div
        className={`
          mb-6 grid grid-cols-2 gap-4
          md:grid-cols-4
        `}
      >
        <KpiTile
          label="Totaal aantal"
          meta="In administratie"
          value={String(stats.total)}
        />
        <KpiTile
          label="Actief"
          meta="Beschikbaar voor klanten"
          value={String(stats.active)}
        />
        <KpiTile
          label="Verlopen / opgebruikt"
          meta="Niet meer beschikbaar"
          value={String(stats.expiredOrDepleted)}
        />
        <KpiTile
          label="Totaal gebruikt"
          meta="Toepassingen door klanten"
          value={String(stats.totalUsed)}
        />
      </div>

      <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <h2 className="mb-1 font-serif text-lg font-medium text-foreground">
          Vouchercodes
        </h2>
        <p className="mb-4 text-[13px] text-muted-foreground">
          Klik op een rij om de voucher te bewerken of te deactiveren.
        </p>

        {sortedVouchers.length === 0 ? (
          <div
            className={`
              rounded-md border border-border bg-background px-6 py-10
              text-center
            `}
          >
            <h3 className="mb-1 text-sm font-semibold text-foreground">
              Nog geen vouchercodes
            </h3>
            <p className="text-xs text-muted-foreground">
              Klik op &quot;Nieuwe vouchercode&quot; om er een aan te maken.
            </p>
          </div>
        ) : (
          <div className="-mx-6 -mb-6 overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className={cn(TH_CLASSES, 'pl-6')}>Code</th>
                  <th className={TH_CLASSES}>Korting</th>
                  <th className={TH_CLASSES}>Beschrijving</th>
                  <th className={TH_CLASSES}>Geldig t/m</th>
                  <th className={TH_CLASSES}>Plan</th>
                  <th className={cn(TH_CLASSES, 'text-right')}>Gebruik</th>
                  <th className={TH_CLASSES}>Status</th>
                  <th className={cn(TH_CLASSES, 'pr-6')} />
                </tr>
              </thead>
              <tbody>
                {sortedVouchers.map(voucher => {
                  const plan = PLANS.find(
                    candidate => candidate.id === voucher.appliesTo,
                  )

                  return (
                    <tr className="hover:bg-[#E9EDEB]" key={voucher.id}>
                      <td
                        className={cn(
                          TD_CLASSES,
                          `pl-6 font-bold tracking-[0.05em] text-foreground`,
                        )}
                      >
                        {voucher.code}
                      </td>
                      <td className={cn(TD_CLASSES, 'text-foreground')}>
                        {voucher.type === 'percentage'
                          ? `${voucher.value}%`
                          : formatEuro(voucher.value)}
                      </td>
                      <td
                        className={cn(
                          TD_CLASSES,
                          'max-w-[280px] text-muted-foreground',
                        )}
                      >
                        {voucher.description || '—'}
                      </td>
                      <td className={cn(TD_CLASSES, 'text-muted-foreground')}>
                        {voucher.validUntil
                          ? formatDateNl(voucher.validUntil)
                          : 'Onbeperkt'}
                      </td>
                      <td className={cn(TD_CLASSES, 'text-muted-foreground')}>
                        {voucher.appliesTo === VOUCHER_APPLIES_TO_ALL
                          ? 'Alle plannen'
                          : (plan?.label ?? voucher.appliesTo)}
                      </td>
                      <td
                        className={cn(
                          TD_CLASSES,
                          'text-right text-muted-foreground',
                        )}
                      >
                        {voucher.maxUses !== null
                          ? `${voucher.usedCount}/${voucher.maxUses}`
                          : voucher.usedCount}
                      </td>
                      <td className={TD_CLASSES}>
                        <VoucherStatusBadge voucher={voucher} />
                      </td>
                      <td
                        className={cn(
                          TD_CLASSES,
                          'pr-6 text-right whitespace-nowrap',
                        )}
                      >
                        <button
                          className={`
                            inline-flex items-center rounded-md px-3 py-[7px]
                            text-[13px] font-semibold text-foreground-secondary
                            transition
                            hover:bg-border-soft
                          `}
                          onClick={() => setEditingId(voucher.id)}
                          type="button"
                        >
                          Bewerken
                        </button>
                        <button
                          aria-label="Verwijderen"
                          className={`
                            inline-flex items-center justify-center rounded-md
                            px-2 py-1.5 text-foreground-secondary transition
                            hover:bg-border-soft
                          `}
                          onClick={() => void onDelete(voucher)}
                          title="Verwijderen"
                          type="button"
                        >
                          <TrashIcon />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(isCreating || editingVoucher) && (
        <AdminVoucherModal onClose={onCloseModal} voucher={editingVoucher} />
      )}
    </div>
  )
}
