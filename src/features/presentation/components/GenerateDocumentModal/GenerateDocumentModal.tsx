'use client'

import { useState, type CSSProperties, type FC } from 'react'

import { GammaFlowModal } from '@shared/gamma'
import { useToastStore } from '@shared/store/toast'

import { preparePresentationGamma } from '../../actions'
import { GAMMA_DOC_TITLE_NOUN } from '../../constants/presentation'
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

const COPY = {
  memorandum: {
    confirmTitle: 'Verkoopmemorandum maken — éénmalige actie',
    primaryLabel: 'Verkoopmemorandum maken',
    warning:
      'het verkoopmemorandum kan slechts één keer worden gemaakt. Het wordt opgeslagen in jouw Documentenkluis. Latere wijzigingen aan jouw bedrijfsprofiel of financiële gegevens hebben geen effect meer op het opgeslagen memorandum.',
    prompt: 'Weet je zeker dat je het verkoopmemorandum nu wilt maken?',
    agree:
      'Ik begrijp dat het memorandum daarna niet meer wijzigt en bewaard blijft in mijn Documentenkluis.',
  },
  teaser: {
    confirmTitle: 'Anoniem verkoopprofiel maken — éénmalige actie',
    primaryLabel: 'Anoniem profiel maken',
    warning:
      'het anoniem verkoopprofiel kan slechts één keer worden gemaakt. Het wordt opgeslagen in jouw Documentenkluis. Latere wijzigingen aan jouw gegevens hebben geen effect meer op dit opgeslagen profiel.',
    prompt:
      'Het anonieme profiel is een teaser zonder bedrijfsnaam, locatie of klantgegevens — bedoeld om vroeg in het traject interesse te peilen. Doorgaan?',
    agree:
      'Ik begrijp dat het profiel daarna niet meer wijzigt en bewaard blijft in mijn Documentenkluis.',
  },
} as const

// Ports openMemorandumModal / openAnonymousProfileModal (osago-bundle.js:19483-
// 19552): the one-time-action confirm. The generate → poll → save chrome is the
// shared GammaFlowModal; the hook lives in the parent so dismissing to the
// background keeps the generation running.
export const GenerateDocumentModal: FC<Props> = ({
  gamma,
  onClose,
  variant,
}) => {
  const showToast = useToastStore(state => state.showToast)
  const [agreed, setAgreed] = useState(false)
  const [isPreparing, setIsPreparing] = useState(false)

  const titleNoun = GAMMA_DOC_TITLE_NOUN[variant]
  const copy = COPY[variant]

  const onConfirm = async (): Promise<void> => {
    setIsPreparing(true)
    const prepared = await preparePresentationGamma(variant)
    setIsPreparing(false)
    if (prepared.error !== null) {
      showToast(prepared.error, 'error')
      onClose()
      return
    }
    await gamma.run({
      description: prepared.data.description,
      fileName: prepared.data.fileName,
      fileType: prepared.data.fileType,
      inputText: prepared.data.inputText,
      numCards: prepared.data.numCards,
      options: prepared.data.options,
      placementPlan: prepared.data.placementPlan,
      variant,
    })
  }

  if (gamma.phase !== 'idle' || isPreparing) {
    return (
      <GammaFlowModal
        busyOverride={isPreparing}
        doneDescription={
          <>
            Het document staat als <strong>PDF</strong> in jouw{' '}
            <strong>Documentenkluis</strong>. Controleer de inhoud; wil je iets
            wijzigen, pas dan de velden in de app aan en genereer het document
            opnieuw.
          </>
        }
        gamma={gamma}
        onClose={onClose}
        titleNoun={titleNoun}
      />
    )
  }

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal" onClick={event => event.stopPropagation()}>
        <div className="modal-header">
          <h3>{copy.confirmTitle}</h3>
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
            <strong style={{ color: '#92400E' }}>Let op:</strong> {copy.warning}
          </div>
          <p className="text-sm" style={{ margin: '0 0 14px' }}>
            {copy.prompt}
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
              checked={agreed}
              onChange={event => setAgreed(event.target.checked)}
              style={{
                accentColor: 'var(--green)',
                cursor: 'pointer',
                flexShrink: 0,
                height: 16,
                marginTop: 3,
                width: 16,
              }}
              type="checkbox"
            />
            <span
              style={{ color: 'var(--ink-2)', fontSize: 13, lineHeight: 1.5 }}
            >
              {copy.agree}
            </span>
          </label>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} type="button">
            Annuleren
          </button>
          <button
            className="btn btn-primary"
            disabled={!agreed}
            onClick={() => void onConfirm()}
            type="button"
          >
            {copy.primaryLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
