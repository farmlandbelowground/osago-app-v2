'use client'

import { useState, type CSSProperties, type FC } from 'react'

import { REGEN_DOC_FEE, REGEN_DOC_INFO } from '../../constants/presentation'
import { type Props } from './types'

const amberAlertStyle: CSSProperties = {
  background: '#FEF7E6',
  borderLeft: '3px solid #D97706',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--ink)',
  fontSize: 13.5,
  lineHeight: 1.55,
  marginBottom: 16,
  padding: '14px 16px',
}

const checkCircleStyle: CSSProperties = {
  alignItems: 'center',
  background: 'var(--green-soft)',
  borderRadius: '50%',
  color: 'var(--green-dark)',
  display: 'inline-flex',
  height: 56,
  justifyContent: 'center',
  marginBottom: 14,
  width: 56,
}

// Ports openRegenerateRequestModal + requestDocumentRegeneration
// (osago-bundle.js:12278-12327). The deliverTemplatedEmail send is deferred to
// Slice 13 (§1.2), so "Aanvragen" only surfaces the confirmation modal — exactly
// legacy's behavior when no email template is enabled.
export const RegenerateRequestModal: FC<Props> = ({
  documentType,
  onClose,
}) => {
  const [confirmed, setConfirmed] = useState(false)
  const info = REGEN_DOC_INFO[documentType]

  if (confirmed) {
    return (
      <div className="modal-overlay active" onClick={onClose}>
        <div className="modal" onClick={event => event.stopPropagation()}>
          <div className="modal-header">
            <h3>Aanvraag ontvangen</h3>
            <button
              aria-label="Sluiten"
              className="modal-close"
              onClick={onClose}
              type="button"
            >
              ✕
            </button>
          </div>
          <div className="modal-body">
            <div style={{ padding: '6px 0', textAlign: 'center' }}>
              <div style={checkCircleStyle}>
                <svg
                  fill="none"
                  height="28"
                  stroke="currentColor"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                  width="28"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p
                style={{
                  color: 'var(--ink-2)',
                  fontSize: 14.5,
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Je aanvraag voor heraanmaak van het{' '}
                <strong>{info.titleNice}</strong> is bij ons binnengekomen.
                <br />
                Een Osago-medewerker neemt binnen één werkdag persoonlijk
                contact met je op.
              </p>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary" onClick={onClose} type="button">
              Sluiten
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal" onClick={event => event.stopPropagation()}>
        <div className="modal-header">
          <h3>Opnieuw {info.titleNice} aanmaken</h3>
          <button
            aria-label="Sluiten"
            className="modal-close"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="alert alert-amber" style={amberAlertStyle}>
            <strong style={{ color: '#92400E' }}>Let op:</strong> het{' '}
            {info.titleNice} kan slechts één keer automatisch worden aangemaakt
            — die actie heb je al uitgevoerd. Het bestand staat nog beschikbaar
            in jouw Documentenkluis.
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.6, margin: '0 0 12px' }}>
            Wil je het {info.titleNice} toch opnieuw laten maken (bijvoorbeeld
            omdat de cijfers of strategie zijn veranderd)? Osago kan dat voor je
            verzorgen tegen <strong>{REGEN_DOC_FEE} eenmalig</strong>.
          </p>
          <p className="text-sm text-muted" style={{ margin: 0 }}>
            Na een aanvraag neemt een Osago-medewerker binnen één werkdag
            contact met je op om de wensen te bespreken en de heraanmaak in gang
            te zetten.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} type="button">
            Annuleren
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setConfirmed(true)}
            type="button"
          >
            Aanvragen
          </button>
        </div>
      </div>
    </div>
  )
}
