'use client'

import Link from 'next/link'
import { useState, useTransition, type FC } from 'react'

import { DOCUMENTENKLUIS_PATH } from '@features/documents/constants/routes'
import { useToastStore } from '@shared/store/toast'

import { generateSalesDocument } from '../../actions'
import {
  SALES_DOCUMENTS,
  SALES_DOCUMENT_DISCLAIMER_INTRO,
} from '../../constants/salesDocuments'
import { CONTRACT_STAGE, LOI_STAGES } from '../../constants/stages'
import { type SalesDocumentKind } from '../../types'
import { LeadModalShell } from '../LeadModalShell'
import { type Props } from './types'

const NAME_REQUIRED_MESSAGE =
  'Vul eerst jouw bedrijfsnaam in onder Mijn bedrijf.'

const DocCard: FC<{
  kind: SalesDocumentKind
  onGenerate: (kind: SalesDocumentKind) => void
}> = ({ kind, onGenerate }) => {
  const meta = SALES_DOCUMENTS[kind]
  return (
    <div className="doc-card" style={{ marginTop: '10px' }}>
      <div className="doc-card-icon">
        <svg
          fill="none"
          height="20"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="20"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" x2="15" y1="13" y2="13" />
          <line x1="9" x2="15" y1="17" y2="17" />
        </svg>
      </div>
      <div className="doc-card-body">
        <div className="doc-card-title">{meta.docCardTitle}</div>
      </div>
      <button
        className="btn btn-primary btn-sm"
        onClick={() => onGenerate(kind)}
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
        {meta.buttonLabel}
      </button>
    </div>
  )
}

// Ports generateNda/generateLoi/generateContract + confirm* + doGenerate* flow
// (osago-bundle.js:21841-22750): pre-flight name check → disclaimer modal with a
// mandatory checkbox → build the .doc server-side → save to the Documentenkluis.
export const SalesDocButtons: FC<Props> = ({
  hasCompanyName,
  leadId,
  persistEdits,
  stage,
}) => {
  const [openKind, setOpenKind] = useState<SalesDocumentKind | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [savedFileName, setSavedFileName] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const showToast = useToastStore(state => state.showToast)

  const availableKinds: SalesDocumentKind[] = [
    'nda',
    ...(LOI_STAGES.includes(stage) ? (['loi'] as const) : []),
    ...(stage === CONTRACT_STAGE ? (['contract'] as const) : []),
  ]

  const onGenerateClick = (kind: SalesDocumentKind): void => {
    if (!hasCompanyName) {
      showToast(NAME_REQUIRED_MESSAGE, 'error')
      return
    }
    setAgreed(false)
    setOpenKind(kind)
  }

  const onConfirm = (): void => {
    if (!openKind || !agreed) {
      return
    }
    const kind = openKind
    startTransition(async () => {
      const persisted = await persistEdits()
      if (!persisted) {
        showToast('Opslaan van de wijzigingen is mislukt.', 'error')
        return
      }
      const result = await generateSalesDocument(leadId, kind)
      if (result.error !== null) {
        showToast(result.error, 'error')
        return
      }
      setOpenKind(null)
      setSavedFileName(result.data.fileName)
    })
  }

  const meta = openKind ? SALES_DOCUMENTS[openKind] : null

  return (
    <>
      {availableKinds.map(kind => (
        <DocCard key={kind} kind={kind} onGenerate={onGenerateClick} />
      ))}

      {meta && (
        <LeadModalShell
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setOpenKind(null)}
                type="button"
              >
                Annuleren
              </button>
              <button
                className="btn btn-primary"
                disabled={!agreed || isPending}
                onClick={onConfirm}
                type="button"
              >
                {isPending ? 'Bezig...' : meta.generateLabel}
              </button>
            </>
          }
          onClose={() => setOpenKind(null)}
          title={meta.modalTitle}
        >
          <div className="alert alert-info" style={{ marginBottom: '14px' }}>
            <strong>Disclaimer:</strong> {SALES_DOCUMENT_DISCLAIMER_INTRO}{' '}
            {meta.disclaimerClosing}
          </div>
          {meta.extraIntro.map(paragraph => (
            <p
              className="text-sm text-muted"
              key={paragraph}
              style={{ marginBottom: '14px' }}
            >
              {paragraph}
            </p>
          ))}
          <p className="text-sm text-muted" style={{ marginBottom: '14px' }}>
            {meta.savedIntro}
          </p>
          <label
            style={{
              alignItems: 'flex-start',
              cursor: 'pointer',
              display: 'flex',
              gap: '10px',
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
                height: '16px',
                marginTop: '3px',
                width: '16px',
              }}
              type="checkbox"
            />
            <span
              style={{
                color: 'var(--ink-2)',
                fontSize: '14px',
                lineHeight: 1.5,
              }}
            >
              Ik heb deze disclaimer gelezen en ga akkoord met de inhoud ervan.
            </span>
          </label>
        </LeadModalShell>
      )}

      {savedFileName && (
        <LeadModalShell
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setSavedFileName(null)}
                type="button"
              >
                Sluiten
              </button>
              <Link className="btn btn-primary" href={DOCUMENTENKLUIS_PATH}>
                Naar Documentenkluis
              </Link>
            </>
          }
          onClose={() => setSavedFileName(null)}
          title="Document opgeslagen"
        >
          <div
            style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}
          >
            {savedFileName}
          </div>
          <p
            style={{
              color: 'var(--ink-2)',
              fontSize: '13.5px',
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            Het document is toegevoegd aan jouw <strong>Documentenkluis</strong>{' '}
            onder &quot;Door uzelf gegenereerd&quot;. Je kunt het daar
            downloaden, opnieuw bekijken of delen.
          </p>
        </LeadModalShell>
      )}
    </>
  )
}
