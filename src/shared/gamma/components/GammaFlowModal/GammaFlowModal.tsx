'use client'

import Link from 'next/link'
import { type CSSProperties, type FC } from 'react'

import { DOCUMENTENKLUIS_PATH } from '@features/documents/constants/routes'

import { type Props } from './types'

const spinnerStyle: CSSProperties = {
  animation: 'spin360 .8s linear infinite',
  border: '3px solid var(--line)',
  borderRadius: '50%',
  borderTopColor: 'var(--green)',
  height: 30,
  margin: '0 auto 18px',
  width: 30,
}

const checkCircleStyle: CSSProperties = {
  alignItems: 'center',
  background: 'var(--green-soft)',
  borderRadius: '50%',
  display: 'flex',
  height: 46,
  justifyContent: 'center',
  margin: '0 auto 14px',
  width: 46,
}

// Shared progress → result → error chrome of generateViaGamma /
// generateValuationViaGamma (osago-bundle.js:19710-19819). The feature supplies
// the noun + done-copy; the confirm/pre-flight step (if any) stays feature-local.
export const GammaFlowModal: FC<Props> = ({
  busyOverride = false,
  doneDescription,
  gamma,
  onClose,
  titleNoun,
}) => {
  const isBusy =
    busyOverride ||
    gamma.phase === 'starting' ||
    gamma.phase === 'generating' ||
    gamma.phase === 'saving'

  const progressMessage =
    gamma.phase === 'saving'
      ? 'Document opslaan in jouw Documentenkluis…'
      : gamma.phase === 'generating'
        ? `Bezig met opstellen… (${gamma.elapsedSeconds}s) — dit duurt doorgaans 1–3 minuten.`
        : 'We stellen jouw document op in de Osago-huisstijl. Dit duurt doorgaans 1–3 minuten — laat dit venster open.'

  const title =
    gamma.phase === 'done'
      ? `${titleNoun} is klaar`
      : gamma.phase === 'error'
        ? `${titleNoun} — er ging iets mis`
        : `${titleNoun} genereren`

  const renderBody = (): React.ReactNode => {
    if (gamma.phase === 'done') {
      return (
        <div style={{ padding: '8px 4px 4px', textAlign: 'center' }}>
          <div style={checkCircleStyle}>
            <svg
              fill="none"
              height="24"
              stroke="var(--green-dark)"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
              width="24"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 style={{ fontSize: 16, margin: '0 0 6px' }}>
            {titleNoun} succesvol gegenereerd
          </h3>
          <p
            className="text-sm text-muted"
            style={{ lineHeight: 1.55, margin: '0 0 4px' }}
          >
            {doneDescription}
          </p>
        </div>
      )
    }

    if (gamma.phase === 'error') {
      return (
        <>
          <div className="alert alert-error" style={{ margin: 0 }}>
            {gamma.error ?? 'Onbekende fout bij genereren.'}
          </div>
          <p className="text-sm text-muted" style={{ margin: '12px 0 0' }}>
            Controleer of de gegevens zijn ingevuld en probeer het opnieuw.
            Blijft het misgaan, neem dan contact op met Osago.
          </p>
        </>
      )
    }

    return (
      <div style={{ padding: '24px 8px', textAlign: 'center' }}>
        <div style={spinnerStyle} />
        <h3 style={{ fontSize: 16, margin: '0 0 6px' }}>
          {titleNoun} wordt opgesteld…
        </h3>
        <p
          className="text-sm text-muted"
          style={{ lineHeight: 1.55, margin: 0 }}
        >
          {progressMessage}
        </p>
      </div>
    )
  }

  const renderFooter = (): React.ReactNode => {
    if (gamma.phase === 'done') {
      return (
        <>
          <button className="btn btn-secondary" onClick={onClose} type="button">
            Sluiten
          </button>
          <Link
            className="btn btn-primary"
            href={DOCUMENTENKLUIS_PATH}
            onClick={onClose}
          >
            Naar Documentenkluis
          </Link>
        </>
      )
    }

    if (gamma.phase === 'error') {
      return (
        <button className="btn btn-secondary" onClick={onClose} type="button">
          Sluiten
        </button>
      )
    }

    return (
      <button className="btn btn-secondary" onClick={onClose} type="button">
        Op de achtergrond laten lopen
      </button>
    )
  }

  if (!isBusy && gamma.phase !== 'done' && gamma.phase !== 'error') {
    return null
  }

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal" onClick={event => event.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button
            aria-label="Sluiten"
            className="modal-close"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>
        <div className="modal-body">{renderBody()}</div>
        <div className="modal-footer">{renderFooter()}</div>
      </div>
    </div>
  )
}
