'use client'

import { useEffect, useState, type FC } from 'react'

import { fileIcon } from '@features/documents/lib/fileIcon'
import { formatFileSize } from '@features/documents/lib/formatFileSize'
import { ImpersonateButton } from '@features/impersonation'
import { approveLeadValidation } from '@features/leads/actions'
import { LEAD_STAGES } from '@features/leads/constants/stages'
import { formatEuro } from '@features/subscriptions/lib/formatEuro'
import { ModalShell } from '@shared/components/ModalShell'
import { useToastStore } from '@shared/store/toast'

import {
  assignAdvisor,
  deleteCustomerDocument,
  downloadCustomerDocument,
  loadCustomerDetail,
  uploadDocumentForCustomer,
} from '../../actions'
import { formatCustomerDate } from '../../lib/format'
import { type CustomerDetail } from '../../types'
import { type Props } from './types'

const stageLabel = (stage: string): string =>
  LEAD_STAGES.find(item => item.id === stage)?.label ?? stage

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

export const CustomerDetailModal: FC<Props> = ({
  customerName,
  onClose,
  userId,
}) => {
  const showToast = useToastStore(state => state.showToast)
  const [detail, setDetail] = useState<CustomerDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    void loadCustomerDetail(userId).then(result => {
      if (isActive) {
        setDetail(result)
        setIsLoading(false)
      }
    })

    return () => {
      isActive = false
    }
  }, [userId])

  const reload = async (): Promise<void> => {
    const result = await loadCustomerDetail(userId)
    setDetail(result)
  }

  const onAssignAdvisor = async (advisorId: string): Promise<void> => {
    const result = await assignAdvisor(userId, advisorId)
    if (result.error) {
      showToast(result.error, 'error')
      return
    }
    showToast(advisorId ? 'Adviseur toegekend.' : 'Adviseur losgekoppeld.')
    await reload()
  }

  const onApprove = async (leadId: string): Promise<void> => {
    const result = await approveLeadValidation(userId, leadId)
    if (result.error) {
      showToast(result.error, 'error')
      return
    }
    showToast('Lead gevalideerd en toegevoegd aan de pipeline.')
    await reload()
  }

  const onUpload = async (file: File | undefined): Promise<void> => {
    if (!file) {
      return
    }
    const dataUrl = await readFileAsDataUrl(file)
    const result = await uploadDocumentForCustomer({
      dataUrl,
      description: '',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || 'application/octet-stream',
      userId,
    })
    if (result.error) {
      showToast(result.error, 'error')
      return
    }
    showToast('Document toegevoegd aan dossier.')
    await reload()
  }

  const onDelete = async (docId: string): Promise<void> => {
    const result = await deleteCustomerDocument(docId)
    if (result.error) {
      showToast(result.error, 'error')
      return
    }
    showToast('Document verwijderd.')
    await reload()
  }

  const onDownload = async (docId: string): Promise<void> => {
    const result = await downloadCustomerDocument(docId)
    if (!result.url) {
      showToast(result.error ?? 'Download mislukt.', 'error')
      return
    }
    window.open(result.url, '_blank', 'noopener,noreferrer')
  }

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

  return (
    <ModalShell
      footer={footer}
      maxWidthClassName="modal-lg"
      onClose={onClose}
      title={customerName}
    >
      {isLoading || !detail ? (
        <p className="text-muted">Klantgegevens laden…</p>
      ) : (
        <>
          <div className="grid-2 mb-4 grid" style={{ fontSize: 13, gap: 12 }}>
            <div>
              <div className="text-xs text-muted fw-600">Project ID</div>
              <div style={{ fontFamily: 'monospace' }}>
                {detail.projectId ?? '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted fw-600">E-mail</div>
              <div>{detail.email}</div>
            </div>
            <div>
              <div className="text-xs text-muted fw-600">Bedrijf</div>
              <div>{detail.company || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-muted fw-600">Geregistreerd</div>
              <div>{formatCustomerDate(detail.createdAt)}</div>
            </div>
            <div>
              <div className="text-xs text-muted fw-600">Account ID</div>
              <div className="text-xs" style={{ fontFamily: 'monospace' }}>
                {detail.id}
              </div>
            </div>
          </div>

          <div className="divider" />
          <h4 className="serif" style={{ marginBottom: 8 }}>
            Bedrijfsprofiel
          </h4>
          {detail.companyProfile.sector ? (
            <div style={{ fontSize: 13 }}>
              <span className="text-muted">Sector:</span>{' '}
              <strong>{detail.companyProfile.sector}</strong>
              {detail.companyProfile.employees !== null && (
                <>
                  {' · '}
                  <span className="text-muted">FTE:</span>{' '}
                  {detail.companyProfile.employees}
                </>
              )}
            </div>
          ) : (
            <p className="text-muted text-sm">Profiel nog niet ingevuld.</p>
          )}

          <div className="divider" />
          <h4 className="serif" style={{ marginBottom: 8 }}>
            Toegekende Osago adviseur
          </h4>
          <select
            onChange={event => void onAssignAdvisor(event.target.value)}
            style={{ maxWidth: 380, width: '100%' }}
            value={detail.advisorId ?? ''}
          >
            <option value="">— Geen adviseur (Team Osago) —</option>
            {detail.advisors.map(advisor => (
              <option key={advisor.id} value={advisor.id}>
                {advisor.name} — {advisor.email}
              </option>
            ))}
          </select>

          <div className="divider" />
          <h4 className="serif" style={{ marginBottom: 8 }}>
            Waardebepaling
          </h4>
          <p className="text-sm text-muted">
            {detail.valuationMade
              ? 'Indicatieve waardebepaling vastgelegd.'
              : 'Nog geen waardebepaling uitgevoerd.'}
          </p>

          {detail.pendingValidations.length > 0 && (
            <>
              <div className="divider" />
              <h4 className="serif" style={{ marginBottom: 8 }}>
                Validatie-aanvragen ({detail.pendingValidations.length})
              </h4>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                {detail.pendingValidations.map(validation => (
                  <div
                    className="flex-between"
                    key={validation.id}
                    style={{
                      border: '1px solid var(--line)',
                      borderRadius: 'var(--radius-sm)',
                      gap: 12,
                      padding: '10px 12px',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{validation.name}</div>
                      <div className="text-xs text-muted">
                        {validation.type} · Betaald op{' '}
                        {formatCustomerDate(validation.paidAt)}
                        {validation.fee !== null
                          ? ` · ${formatEuro(validation.fee)}`
                          : ''}
                      </div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => void onApprove(validation.id)}
                      type="button"
                    >
                      Markeer als gevalideerd
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="divider" />
          <h4 className="serif" style={{ marginBottom: 8 }}>
            Pipeline ({detail.pipeline.length})
          </h4>
          {detail.pipeline.length === 0 ? (
            <p className="text-muted text-sm">Geen kopers in pipeline.</p>
          ) : (
            <table style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Koper</th>
                  <th>Fase</th>
                  <th>Fit</th>
                </tr>
              </thead>
              <tbody>
                {detail.pipeline.map(entry => (
                  <tr key={entry.id}>
                    <td>{entry.name}</td>
                    <td>{stageLabel(entry.stage)}</td>
                    <td>{entry.fitScore}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="divider" />
          <div className="flex-between" style={{ marginBottom: 8 }}>
            <h4 className="serif" style={{ margin: 0 }}>
              Documentenkluis
            </h4>
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
              <svg
                fill="none"
                height="13"
                stroke="currentColor"
                strokeWidth="2"
                style={{ marginRight: 4, verticalAlign: -2 }}
                viewBox="0 0 24 24"
                width="13"
              >
                <line x1="12" x2="12" y1="5" y2="19" />
                <line x1="5" x2="19" y1="12" y2="12" />
              </svg>
              Document toevoegen
              <input
                onChange={event => void onUpload(event.target.files?.[0])}
                style={{ display: 'none' }}
                type="file"
              />
            </label>
          </div>
          {detail.documents.length === 0 ? (
            <p className="text-muted text-sm">Nog geen documenten in het dossier.</p>
          ) : (
            <div className="doc-list">
              {detail.documents.map(doc => {
                const icon = fileIcon(doc.fileType, doc.fileName)

                return (
                  <div
                    className="doc-item"
                    key={doc.id}
                    style={{ padding: '10px 12px' }}
                  >
                    <div
                      className="doc-icon"
                      style={{
                        background: icon.color,
                        fontSize: 10,
                        height: 36,
                        width: 36,
                      }}
                    >
                      {icon.label}
                    </div>
                    <div className="doc-info">
                      <div className="doc-name" style={{ fontSize: 13.5 }}>
                        {doc.fileName}
                      </div>
                      <div className="doc-meta">
                        {formatFileSize(doc.fileSize)} ·{' '}
                        {formatCustomerDate(doc.uploadedAt)}
                        {doc.description ? ` · ${doc.description}` : ''}
                      </div>
                    </div>
                    <div className="doc-actions">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => void onDownload(doc.id)}
                        title="Download"
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
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                        </svg>
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => void onDelete(doc.id)}
                        style={{ padding: '6px 8px' }}
                        title="Verwijderen"
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
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </ModalShell>
  )
}
