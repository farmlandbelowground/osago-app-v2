'use client'

import { type FC, useState } from 'react'

import { KpiTile } from '@shared/components/KpiTile'
import { useToastStore } from '@shared/store/toast'

import { AFSPRAAK_PATH } from '../../constants'
import { appointmentLocationLabelShort } from '../../lib/format'
import { type AppointmentType } from '../../types'
import { AdminAppointmentTypeModal } from '../AdminAppointmentTypeModal'
import { type Props } from './types'

export const AdminAppointmentTypesGrid: FC<Props> = ({
  bookings,
  medewerkers,
  types,
}) => {
  const showToast = useToastStore(state => state.showToast)
  const [editingType, setEditingType] = useState<AppointmentType | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const activeCount = types.filter(item => item.active).length
  const nameById = new Map(medewerkers.map(item => [item.id, item.name]))

  const bookingCountByType = new Map<string, number>()
  for (const booking of bookings) {
    if (booking.appointmentTypeId) {
      bookingCountByType.set(
        booking.appointmentTypeId,
        (bookingCountByType.get(booking.appointmentTypeId) ?? 0) + 1,
      )
    }
  }

  const origin = typeof window === 'undefined' ? '' : window.location.origin

  const onCloseModal = (): void => {
    setEditingType(null)
    setIsCreating(false)
  }

  const onCopy = (url: string): void => {
    void navigator.clipboard.writeText(url)
    showToast('Boekingslink gekopieerd.')
  }

  const modalType = isCreating ? null : editingType

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Afspraaktypen</h1>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-primary"
            onClick={() => setIsCreating(true)}
            type="button"
          >
            + Nieuw afspraaktype
          </button>
        </div>
      </div>

      <div className="grid-2 mb-5 grid">
        <KpiTile
          label="Afspraaktypen"
          meta={`${activeCount} actief`}
          value={String(types.length)}
        />
        <KpiTile
          label="Boekingen totaal"
          meta="Bekijk de details onder Geboekte afspraken"
          value={String(bookings.length)}
        />
      </div>

      {types.length === 0 ? (
        <div className="card">
          <div className="empty" style={{ padding: '48px 24px' }}>
            <h3>Nog geen afspraaktypen</h3>
            <p>
              Maak een afspraaktype aan dat klanten via de boekingslink kunnen
              reserveren.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid-2 grid">
          {types.map(item => {
            const adminNames = item.assignedAdminIds
              .map(id => nameById.get(id))
              .filter(Boolean)
              .join(', ')
            const url = `${origin}${AFSPRAAK_PATH}/${item.slug}`
            const bookingCount = bookingCountByType.get(item.id) ?? 0

            return (
              <div
                className="card"
                key={item.id}
                onClick={() => setEditingType(item)}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    setEditingType(item)
                  }
                }}
                role="button"
                style={{ cursor: 'pointer' }}
                tabIndex={0}
              >
                <div
                  style={{
                    alignItems: 'center',
                    display: 'flex',
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      background: item.color,
                      borderRadius: 4,
                      display: 'inline-block',
                      height: 14,
                      width: 14,
                    }}
                  />
                  <h3 style={{ flex: 1, margin: 0 }}>{item.name}</h3>
                  {item.active ? (
                    <span className="badge badge-green">Actief</span>
                  ) : (
                    <span className="badge badge-gray">Inactief</span>
                  )}
                </div>
                <div
                  className="text-sm text-muted"
                  style={{ lineHeight: 1.45, marginBottom: 10 }}
                >
                  {item.description || '—'}
                </div>
                <div
                  className="grid-2 grid"
                  style={{ fontSize: 12.5, gap: 6, marginBottom: 10 }}
                >
                  <div>
                    <span className="text-muted">Duur:</span> {item.duration}{' '}
                    min
                  </div>
                  <div>
                    <span className="text-muted">Locatie:</span>{' '}
                    {appointmentLocationLabelShort(item)}
                  </div>
                  <div>
                    <span className="text-muted">Medewerker(s):</span>{' '}
                    {adminNames || '—'}
                  </div>
                  <div>
                    <span className="text-muted">Boekingen:</span>{' '}
                    {bookingCount}
                  </div>
                </div>
                <div
                  className="flex-between"
                  style={{
                    alignItems: 'center',
                    borderTop: '1px solid var(--line-soft)',
                    gap: 8,
                    paddingTop: 10,
                  }}
                >
                  <div
                    style={{
                      color: 'var(--muted)',
                      flex: 1,
                      fontFamily: 'monospace',
                      fontSize: 11.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {url}
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={event => {
                      event.stopPropagation()
                      onCopy(url)
                    }}
                    title="Boekingslink kopiëren"
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
                </div>
              </div>
            )
          })}
        </div>
      )}

      {(isCreating || editingType) && (
        <AdminAppointmentTypeModal
          admins={medewerkers}
          bookingCount={
            modalType ? (bookingCountByType.get(modalType.id) ?? 0) : 0
          }
          onClose={onCloseModal}
          type={modalType}
        />
      )}
    </>
  )
}
