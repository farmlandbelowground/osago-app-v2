'use client'

import { type ChangeEvent, type FC, useState } from 'react'

import { describeVoucher } from '@features/subscriptions/lib/describeVoucher'
import { type Voucher } from '@features/subscriptions/types'
import { KpiTile } from '@shared/components/KpiTile'
import { useToastStore } from '@shared/store/toast'

import { PARTNER_REFERRAL_COUNT_PLACEHOLDER } from '../../constants'
import { buildPartnerRegistrationUrl } from '../../lib/partnerRegistrationUrl'
import { AdminPartnerModal } from '../AdminPartnerModal'
import { type Props } from './types'

export const AdminPartnersTable: FC<Props> = ({ partners, vouchers }) => {
  const showToast = useToastStore(state => state.showToast)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [searchText, setSearchText] = useState('')

  const vouchersById = new Map<string, Voucher>(
    vouchers.map(voucher => [voucher.id, voucher]),
  )
  const resolveVoucher = (partner: {
    voucherId: string | null
  }): Voucher | null =>
    partner.voucherId ? (vouchersById.get(partner.voucherId) ?? null) : null

  const activeCount = partners.filter(partner => partner.active).length
  const withVoucherCount = partners.filter(
    partner => resolveVoucher(partner) !== null,
  ).length

  const origin = typeof window === 'undefined' ? '' : window.location.origin

  const query = searchText.trim().toLowerCase()
  const filteredPartners = partners.filter(partner => {
    const voucher = resolveVoucher(partner)
    const haystack = [
      partner.name,
      partner.slug,
      partner.contactEmail,
      partner.contactPerson,
      voucher?.code ?? '',
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })

  const editingPartner =
    partners.find(partner => partner.id === editingId) ?? null
  const modalPartner = isCreating ? null : editingPartner

  const onCloseModal = (): void => {
    setEditingId(null)
    setIsCreating(false)
  }

  const onSearchChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setSearchText(event.target.value)
  }

  const onCopy = (slug: string): void => {
    void navigator.clipboard.writeText(
      buildPartnerRegistrationUrl(slug, origin),
    )
    showToast('Registratielink gekopieerd naar klembord.')
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Partners</h1>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-primary"
            onClick={() => setIsCreating(true)}
            type="button"
          >
            + Nieuwe partner
          </button>
        </div>
      </div>

      <div className="grid-3 mb-5 grid">
        <KpiTile
          label="Totaal partners"
          meta={`${activeCount} actief`}
          value={String(partners.length)}
        />
        <KpiTile
          label="Met gekoppelde voucher"
          meta="Korting wordt auto-toegepast"
          value={String(withVoucherCount)}
        />
        <KpiTile
          label="Geregistreerd via partner"
          meta="Klanten met partner-referral"
          value={String(PARTNER_REFERRAL_COUNT_PLACEHOLDER)}
        />
      </div>

      <div className="card">
        <div
          className="flex-between mb-3"
          style={{ flexWrap: 'wrap', gap: 12 }}
        >
          <div>
            <h3>Partneroverzicht</h3>
            <p className="desc" style={{ marginBottom: 0 }}>
              Klik op een rij om de partner te bewerken of de unieke
              registratielink te kopiëren.
            </p>
          </div>
          <div style={{ maxWidth: '100%', position: 'relative', width: 280 }}>
            <svg
              fill="none"
              height="14"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                color: 'var(--muted)',
                left: 10,
                pointerEvents: 'none',
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
              viewBox="0 0 24 24"
              width="14"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              onChange={onSearchChange}
              placeholder="Zoek op naam, slug of e-mail..."
              style={{
                fontSize: 13,
                padding: '8px 12px 8px 32px',
                width: '100%',
              }}
              type="text"
              value={searchText}
            />
          </div>
        </div>

        {partners.length === 0 ? (
          <div className="empty" style={{ padding: '48px 24px' }}>
            <h3>Nog geen partners</h3>
            <p>
              Voeg een partner toe om een eigen registratielink te genereren
              waarmee klanten zich kunnen aanmelden — eventueel met automatische
              korting.
            </p>
          </div>
        ) : (
          <div style={{ margin: '0 -24px -24px', overflowX: 'auto' }}>
            <table style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: 24 }}>Partner</th>
                  <th>Slug / link</th>
                  <th>Voucher</th>
                  <th>Klanten</th>
                  <th>Status</th>
                  <th className="right" style={{ paddingRight: 24 }} />
                </tr>
              </thead>
              <tbody>
                {filteredPartners.map(partner => {
                  const voucher = resolveVoucher(partner)
                  const url = buildPartnerRegistrationUrl(partner.slug, origin)

                  return (
                    <tr
                      key={partner.id}
                      onClick={() => setEditingId(partner.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ paddingLeft: 24 }}>
                        <div
                          style={{
                            alignItems: 'center',
                            display: 'flex',
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              alignItems: 'center',
                              background: 'var(--line-soft)',
                              borderRadius: 8,
                              display: 'flex',
                              flexShrink: 0,
                              height: 36,
                              justifyContent: 'center',
                              overflow: 'hidden',
                              width: 36,
                            }}
                          >
                            {partner.logo ? (
                              // eslint-disable-next-line @next/next/no-img-element -- base64 data URL, next/image cannot optimize
                              <img
                                alt={partner.name}
                                src={partner.logo}
                                style={{
                                  display: 'block',
                                  maxHeight: '100%',
                                  maxWidth: '100%',
                                }}
                              />
                            ) : (
                              <span
                                style={{
                                  color: 'var(--muted)',
                                  fontSize: 13,
                                  fontWeight: 600,
                                }}
                              >
                                {(partner.name || '?')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <strong>{partner.name}</strong>
                            {(partner.contactPerson ||
                              partner.contactEmail) && (
                              <div className="text-xs text-muted">
                                {partner.contactPerson
                                  ? `${partner.contactPerson}${partner.contactEmail ? ` · ${partner.contactEmail}` : ''}`
                                  : partner.contactEmail}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div
                          style={{ fontFamily: 'monospace', fontSize: 12.5 }}
                        >
                          {partner.slug}
                        </div>
                        <div
                          className="text-xs text-muted"
                          style={{ wordBreak: 'break-all' }}
                        >
                          {url}
                        </div>
                      </td>
                      <td>
                        {voucher ? (
                          <>
                            <span className="badge badge-green">
                              {voucher.code}
                            </span>{' '}
                            <span className="text-xs text-muted">
                              {describeVoucher(voucher)}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>{PARTNER_REFERRAL_COUNT_PLACEHOLDER}</td>
                      <td>
                        {partner.active ? (
                          <span className="badge badge-green">Actief</span>
                        ) : (
                          <span className="badge badge-gray">Inactief</span>
                        )}
                      </td>
                      <td
                        className="right"
                        style={{ paddingRight: 24, whiteSpace: 'nowrap' }}
                      >
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={event => {
                            event.stopPropagation()
                            onCopy(partner.slug)
                          }}
                          title="Registratielink kopiëren"
                          type="button"
                        >
                          <svg
                            fill="none"
                            height="13"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            width="13"
                          >
                            <rect height="13" rx="2" width="13" x="9" y="9" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
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

      {(isCreating || editingPartner) && (
        <AdminPartnerModal
          onClose={onCloseModal}
          partner={modalPartner}
          vouchers={vouchers}
        />
      )}
    </div>
  )
}
