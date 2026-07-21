'use client'

import { type FC } from 'react'

import { MANUAL_LEAD_VALIDATION_FEE } from '../../constants/validation'
import { LeadModalShell } from '../LeadModalShell'
import { type Props } from './types'

const FEE_LABEL = `€${MANUAL_LEAD_VALIDATION_FEE.toLocaleString('nl-NL')}`

// Ports confirmManualLeadPipelineAdd's warning modal (osago-bundle.js:20695-20721).
// Offers both paths (OQ-3): self-add (free, immediate) and Osago validation
// (paid initiation → Mollie checkout).
export const ManualLeadPromoteModal: FC<Props> = ({
  isPending,
  onClose,
  onSelfAdd,
  onValidation,
}) => {
  return (
    <LeadModalShell
      footer={
        <>
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost" onClick={onClose} type="button">
            Annuleren
          </button>
        </>
      }
      maxWidthClassName="modal-lg"
      onClose={onClose}
      title="Let op — handmatig toegevoegde lead"
    >
      <div
        style={{
          background: '#FEF7E6',
          borderLeft: '3px solid #D97706',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '20px',
          padding: '14px 16px',
        }}
      >
        <div style={{ alignItems: 'flex-start', display: 'flex', gap: '12px' }}>
          <svg
            fill="none"
            height="20"
            stroke="#A8530A"
            strokeWidth="2"
            style={{ flexShrink: 0, marginTop: '1px' }}
            viewBox="0 0 24 24"
            width="20"
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" x2="12" y1="9" y2="13" />
            <line x1="12" x2="12.01" y1="17" y2="17" />
          </svg>
          <div style={{ color: '#7A3D08', lineHeight: 1.55 }}>
            <strong
              style={{
                color: '#5A2D06',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              Let op!
            </strong>
            Deze lead is handmatig toegevoegd en niet gevalideerd door Osago.
            Dit betekent dat eerst gecontroleerd moet worden of deze partij
            interesse heeft door het verstrekken van het anonieme
            verkoopprofiel. Dit kun je zelf doen, maar dan gaat de discretie van
            het proces verloren. Dit kan ook door een Osago-medewerker gedaan
            worden. De kosten hiervan bedragen <strong>{FEE_LABEL}</strong> per
            geïnteresseerde.
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gap: '14px',
          gridTemplateColumns: '1fr 1fr',
        }}
      >
        <div
          className="card"
          style={{ background: '#FAFBFA', padding: '18px' }}
        >
          <div
            style={{
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '6px',
            }}
          >
            Toch zelf toevoegen
          </div>
          <p
            className="text-muted text-sm"
            style={{ lineHeight: 1.5, margin: '0 0 14px' }}
          >
            Je benadert de partij zelf en accepteert dat de discretie van het
            verkoopproces hierbij niet door Osago wordt geborgd.
          </p>
          <button
            className="btn btn-secondary btn-sm"
            disabled={isPending}
            onClick={onSelfAdd}
            style={{ width: '100%' }}
            type="button"
          >
            Toch toevoegen aan pipeline
          </button>
        </div>
        <div
          className="card"
          style={{
            background: '#F0F9F4',
            border: '1px solid #BBE3C9',
            padding: '18px',
          }}
        >
          <div
            style={{
              color: 'var(--green-dark)',
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '6px',
            }}
          >
            Validatie door Osago
          </div>
          <p
            className="text-muted text-sm"
            style={{ lineHeight: 1.5, margin: '0 0 14px' }}
          >
            Een Osago-medewerker neemt anoniem contact op om interesse te
            peilen. <strong>{FEE_LABEL}</strong> per geïnteresseerde.
          </p>
          <button
            className="btn btn-primary btn-sm"
            disabled={isPending}
            onClick={onValidation}
            style={{ width: '100%' }}
            type="button"
          >
            Validatie aanvragen — {FEE_LABEL}
          </button>
        </div>
      </div>
    </LeadModalShell>
  )
}
