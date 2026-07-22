'use client'

import { useState, type FC } from 'react'

import { ModalShell } from '@shared/components/ModalShell'

import { type Props } from './types'

// Disclaimer + one-time consent modal (osago-bundle.js:7622-7658): the generate
// button stays disabled until the consent checkbox is ticked.
export const ImprovementReportModal: FC<Props> = ({
  isPending,
  onClose,
  onGenerate,
}) => {
  const [isAgreed, setIsAgreed] = useState(false)

  const footer = (
    <>
      <button className="btn btn-secondary" onClick={onClose} type="button">
        Annuleren
      </button>
      <button
        className="btn btn-primary"
        disabled={!isAgreed || isPending}
        onClick={() => onGenerate()}
        type="button"
      >
        Verbeterrapport genereren
      </button>
    </>
  )

  return (
    <ModalShell footer={footer} onClose={onClose} title="Verbeterrapport genereren">
      <div className="alert alert-info" style={{ marginBottom: 14 }}>
        <strong>Disclaimer:</strong> Dit verbeterrapport bundelt de
        aandachtspunten op basis van de in de scan beantwoorde stellingen. Het
        is een momentopname en geen volledige due diligence — Osago aanvaardt
        geen aansprakelijkheid voor de volledigheid of geschiktheid van de
        geïdentificeerde verbeterpunten voor jouw specifieke situatie.
      </div>
      <div className="alert alert-amber" style={{ marginBottom: 14 }}>
        <strong style={{ color: '#92400E' }}>Eénmalige actie:</strong> het
        verbeterrapport kan slechts één keer automatisch worden aangemaakt.
        Daarna kun je een heraanmaak aanvragen via Osago tegen{' '}
        <strong>€ 199,- eenmalig</strong>.
      </div>
      <p className="text-sm text-muted" style={{ marginBottom: 14 }}>
        Het rapport wordt opgeslagen in jouw <strong>Documentenkluis</strong>{' '}
        waar je het kunt downloaden, opnieuw bekijken of delen.
      </p>
      <label
        style={{
          alignItems: 'flex-start',
          cursor: 'pointer',
          display: 'flex',
          gap: 10,
          padding: '6px 2px',
        }}
      >
        <input
          checked={isAgreed}
          onChange={event => setIsAgreed(event.target.checked)}
          style={{
            accentColor: 'var(--green)',
            flexShrink: 0,
            height: 16,
            marginTop: 3,
            width: 16,
          }}
          type="checkbox"
        />
        <span style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.5 }}>
          Ik heb de disclaimer gelezen en begrijp dat het rapport eenmalig wordt
          aangemaakt.
        </span>
      </label>
    </ModalShell>
  )
}
