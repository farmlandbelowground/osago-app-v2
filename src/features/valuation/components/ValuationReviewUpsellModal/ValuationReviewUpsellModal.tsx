'use client'

import { useState, type CSSProperties, type FC } from 'react'

import { type Props } from './types'

// Ports legacy openValuationReviewUpsellModal (osago-bundle.js:19276-19318).
// NOTE: the internal upsell-notification email that legacy's "Controle
// aanvragen" sends (template `upsell_interest_internal`) is part of the
// deferred premium/review flow and is not wired yet — this shows only the
// customer-facing confirmation.
const AMBER_ALERT: CSSProperties = {
  background: '#FEF7E6',
  borderLeft: '3px solid #D97706',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--ink)',
  fontSize: '13.5px',
  lineHeight: 1.55,
  marginBottom: '16px',
  padding: '14px 16px',
}

export const ValuationReviewUpsellModal: FC<Props> = ({ isOpen, onClose }) => {
  const [isSent, setIsSent] = useState(false)

  if (!isOpen) {
    return null
  }

  const handleClose = (): void => {
    setIsSent(false)
    onClose()
  }

  if (isSent) {
    return (
      <div className="modal-overlay active" onClick={handleClose}>
        <div className="modal" onClick={event => event.stopPropagation()}>
          <div className="modal-header">
            <h3>Aanvraag ontvangen</h3>
            <button
              aria-label="Sluiten"
              className="modal-close"
              onClick={handleClose}
              type="button"
            >
              ✕
            </button>
          </div>
          <div className="modal-body">
            <div style={{ padding: '6px 0', textAlign: 'center' }}>
              <div
                style={{
                  alignItems: 'center',
                  background: 'var(--green-soft)',
                  borderRadius: '50%',
                  color: 'var(--green-dark)',
                  display: 'inline-flex',
                  height: '56px',
                  justifyContent: 'center',
                  marginBottom: '14px',
                  width: '56px',
                }}
              >
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
                  fontSize: '14.5px',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Je aanvraag voor een controle van je waardebepaling is
                binnengekomen. Een Osago-medewerker neemt binnen één werkdag
                persoonlijk contact met je op.
              </p>
            </div>
          </div>
          <div className="modal-footer">
            <button
              className="btn btn-primary"
              onClick={handleClose}
              type="button"
            >
              Sluiten
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay active" onClick={handleClose}>
      <div className="modal" onClick={event => event.stopPropagation()}>
        <div className="modal-header">
          <h3>Controle door Osago-medewerker</h3>
          <button
            aria-label="Sluiten"
            className="modal-close"
            onClick={handleClose}
            type="button"
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div style={AMBER_ALERT}>
            <strong style={{ color: '#92400E' }}>
              Waardebepaling Premium-feature:
            </strong>{' '}
            bij het Waardebepaling Premium-pakket controleert een Osago-medewerker
            jouw indicatieve waardebepaling vóór &apos;ie wordt vastgelegd. Dat
            geeft extra zekerheid dat de uitkomst goed onderbouwd is voor gebruik
            in je verkooptraject.
          </div>
          <p style={{ fontSize: '14px', lineHeight: 1.6, margin: '0 0 12px' }}>
            In jouw huidige pakket kun je deze losse controle alsnog aanvragen —
            een Osago-medewerker neemt binnen één werkdag contact op om het tarief
            en de planning te bespreken.
          </p>
          <p className="text-sm text-muted" style={{ margin: 0 }}>
            Je kunt overigens nu al direct de waardering vastleggen via
            &quot;Waardering maken&quot; — die optie blijft beschikbaar.
          </p>
        </div>
        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={handleClose}
            type="button"
          >
            Sluiten
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setIsSent(true)}
            type="button"
          >
            Controle aanvragen
          </button>
        </div>
      </div>
    </div>
  )
}
