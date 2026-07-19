'use client'

import { useMemo, useState, type FC, type SVGProps } from 'react'

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
      <div className="page-header">
        <div>
          <h1 className="page-title">Vouchers</h1>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-primary"
            onClick={() => setIsCreating(true)}
            type="button"
          >
            + Nieuwe vouchercode
          </button>
        </div>
      </div>

      <div className="grid-4 mb-5 grid">
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

      <div className="card">
        <div className="flex-between mb-3">
          <div>
            <h3>Vouchercodes</h3>
            <p className="desc" style={{ marginBottom: 0 }}>
              Klik op een rij om de voucher te bewerken of te deactiveren.
            </p>
          </div>
        </div>

        {sortedVouchers.length === 0 ? (
          <div className="empty" style={{ padding: '36px 20px' }}>
            <h3>Nog geen vouchercodes</h3>
            <p>Klik op &quot;Nieuwe vouchercode&quot; om er een aan te maken.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', margin: '0 -24px -24px' }}>
            <table style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: 24 }}>Code</th>
                  <th>Korting</th>
                  <th>Beschrijving</th>
                  <th>Geldig t/m</th>
                  <th>Plan</th>
                  <th className="right">Gebruik</th>
                  <th>Status</th>
                  <th className="right" style={{ paddingRight: 24 }} />
                </tr>
              </thead>
              <tbody>
                {sortedVouchers.map(voucher => {
                  const plan = PLANS.find(
                    candidate => candidate.id === voucher.appliesTo,
                  )

                  return (
                    <tr key={voucher.id}>
                      <td style={{ paddingLeft: 24 }}>
                        <strong
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            letterSpacing: '0.05em',
                          }}
                        >
                          {voucher.code}
                        </strong>
                      </td>
                      <td>
                        {voucher.type === 'percentage'
                          ? `${voucher.value}%`
                          : formatEuro(voucher.value)}
                      </td>
                      <td style={{ maxWidth: 280 }}>
                        {voucher.description || '—'}
                      </td>
                      <td className="text-muted">
                        {voucher.validUntil
                          ? formatDateNl(voucher.validUntil)
                          : 'Onbeperkt'}
                      </td>
                      <td>
                        {voucher.appliesTo === VOUCHER_APPLIES_TO_ALL
                          ? 'Alle plannen'
                          : (plan?.label ?? voucher.appliesTo)}
                      </td>
                      <td className="right text-muted">
                        {voucher.maxUses !== null
                          ? `${voucher.usedCount}/${voucher.maxUses}`
                          : voucher.usedCount}
                      </td>
                      <td>
                        <VoucherStatusBadge voucher={voucher} />
                      </td>
                      <td
                        className="right"
                        style={{ paddingRight: 24, whiteSpace: 'nowrap' }}
                      >
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setEditingId(voucher.id)}
                          type="button"
                        >
                          Bewerken
                        </button>
                        <button
                          aria-label="Verwijderen"
                          className="btn btn-ghost btn-sm"
                          onClick={() => void onDelete(voucher)}
                          style={{ padding: '6px 8px' }}
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
