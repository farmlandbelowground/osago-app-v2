'use client'

import { useState, type FC } from 'react'

import { ImpersonateButton } from '@features/impersonation'
import { cn } from '@shared/utils/cn'

import { type ProjectType } from '../../types'
import { AddBuyerModal } from '../AddBuyerModal'
import { AdminSearchInput } from '../AdminSearchInput'
import { CustomerDetailModal } from '../CustomerDetailModal'
import { type Props } from './types'

type TypeFilter = 'all' | ProjectType

interface Selection {
  customerName: string
  userId: string
}

const TYPE_FILTERS: { label: string; value: TypeFilter }[] = [
  { label: 'Alles', value: 'all' },
  { label: 'Verkoop', value: 'verkoop' },
  { label: 'Waardebepaling', value: 'waardebepaling' },
]

export const AdminProjectsGrid: FC<Props> = ({ projects }) => {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [detail, setDetail] = useState<Selection | null>(null)
  const [addBuyer, setAddBuyer] = useState<Selection | null>(null)

  const query = search.trim().toLowerCase()
  const visible = projects.filter(project => {
    if (typeFilter !== 'all' && project.type !== typeFilter) {
      return false
    }
    if (!query) {
      return true
    }
    return [project.projectId, project.companyName, project.customerName, project.sector]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query)
  })

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Lopende projecten</h1>
        </div>
        <div className="page-actions" style={{ flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'inline-flex', gap: 4 }}>
            {TYPE_FILTERS.map(filter => (
              <button
                className={cn(
                  'filter-chip',
                  typeFilter === filter.value && 'active',
                )}
                key={filter.value}
                onClick={() => setTypeFilter(filter.value)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
          <AdminSearchInput
            onChange={setSearch}
            placeholder="Zoek op project-ID, klant of bedrijf…"
            value={search}
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="card">
          <div className="empty">
            <h3>Nog geen projecten</h3>
            <p>
              Projecten worden automatisch aangemaakt zodra een klant een lopend
              abonnement heeft.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid-2 grid">
          {visible.map(project => (
            <div className="card" key={project.userId}>
              <div
                className="flex-between mb-2"
                style={{ alignItems: 'flex-start', gap: 8 }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      alignItems: 'center',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      className={cn(
                        'badge',
                        project.isVerkoop ? 'badge-blue' : 'badge-amber',
                      )}
                    >
                      {project.isVerkoop ? 'Verkoop' : 'Waardebepaling'}
                    </span>
                    <span
                      style={{ fontFamily: 'monospace', fontWeight: 600 }}
                    >
                      {project.projectId}
                    </span>
                  </div>
                  <h3 style={{ margin: '0 0 2px' }}>{project.companyName}</h3>
                  <div className="text-sm text-muted">
                    {project.customerName}
                    {project.sector !== '—' ? ` · ${project.sector}` : ''}
                  </div>
                </div>
                <div
                  className={cn(
                    'badge',
                    project.valueLabel ? 'badge-green' : 'badge-gray',
                  )}
                >
                  {project.valueLabel ?? 'Geen waarde'}
                </div>
              </div>

              {project.isVerkoop && (
                <div
                  className="grid-2 grid"
                  style={{ fontSize: 12.5, gap: 6, marginTop: 10 }}
                >
                  <div>
                    <span className="text-muted">Pipeline:</span>{' '}
                    {project.pipelineCount}{' '}
                    {project.pipelineCount === 1 ? 'koper' : 'kopers'}
                  </div>
                  <div>
                    <span className="text-muted">Verst gevorderd:</span>{' '}
                    {project.furthestStageLabel}
                  </div>
                </div>
              )}

              <div
                className="flex-between"
                style={{
                  color: 'var(--muted)',
                  fontSize: 11.5,
                  marginTop: 14,
                }}
              >
                <span>Voortgang dashboard</span>
                <span style={{ color: 'var(--ink)', fontWeight: 600 }}>
                  {project.progress.completed} / {project.progress.total}
                </span>
              </div>
              <div
                style={{
                  background: 'var(--line-soft)',
                  borderRadius: 99,
                  height: 6,
                  marginTop: 6,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    background: 'var(--green)',
                    height: '100%',
                    transition: 'width .3s',
                    width: `${project.progress.pct}%`,
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  justifyContent: 'flex-end',
                  marginTop: 14,
                }}
              >
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() =>
                    setDetail({
                      customerName: project.customerName,
                      userId: project.userId,
                    })
                  }
                  type="button"
                >
                  Details
                </button>
                {project.isVerkoop && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() =>
                      setAddBuyer({
                        customerName: project.customerName,
                        userId: project.userId,
                      })
                    }
                    type="button"
                  >
                    + Koper toevoegen
                  </button>
                )}
                <ImpersonateButton
                  className="btn btn-primary btn-sm"
                  customerName={project.customerName}
                  label="Inloggen als klant"
                  userId={project.userId}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {detail && (
        <CustomerDetailModal
          customerName={detail.customerName}
          onClose={() => setDetail(null)}
          userId={detail.userId}
        />
      )}
      {addBuyer && (
        <AddBuyerModal
          customerName={addBuyer.customerName}
          onClose={() => setAddBuyer(null)}
          targetUserId={addBuyer.userId}
        />
      )}
    </>
  )
}
