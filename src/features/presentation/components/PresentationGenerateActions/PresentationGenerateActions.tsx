'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type CSSProperties, type FC } from 'react'

import { useGammaGeneration } from '@shared/gamma'

import {
  type PresentationGenerateVariant,
  type RegenerateDocumentType,
} from '../../types'
import { GenerateDocumentModal } from '../GenerateDocumentModal'
import { PresentationReviewActions } from '../PresentationReviewActions'
import { RegenerateRequestModal } from '../RegenerateRequestModal'
import { type Props } from './types'

type ModalState =
  | { kind: 'generate'; variant: PresentationGenerateVariant }
  | { kind: 'regenerate'; documentType: RegenerateDocumentType }
  | null

const iconStyle: CSSProperties = { marginRight: 4, verticalAlign: '-2px' }

const DownloadIcon: FC = () => (
  <svg
    fill="none"
    height="14"
    stroke="currentColor"
    strokeWidth="2"
    style={iconStyle}
    viewBox="0 0 24 24"
    width="14"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
)

const CheckIcon: FC = () => (
  <svg
    fill="none"
    height="14"
    stroke="currentColor"
    strokeWidth="3"
    style={iconStyle}
    viewBox="0 0 24 24"
    width="14"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

// Ports the header-actions IIFE (osago-bundle.js:18516-18573): switches between
// the review path (Plus/Premium) and the two generate buttons (each flipping to
// the €199 regenerate modal once made), plus the Basic upsell. The Gamma hook
// lives here so a generation continues if its modal is dismissed to background.
export const PresentationGenerateActions: FC<Props> = ({
  anonDone,
  memoDone,
  reviewRequired,
  reviewStatus,
}) => {
  const router = useRouter()
  const gamma = useGammaGeneration()
  const [modal, setModal] = useState<ModalState>(null)

  useEffect(() => {
    if (gamma.phase === 'done') {
      router.refresh()
    }
  }, [gamma.phase, router])

  const closeModal = (): void => setModal(null)

  const openGenerate = (variant: PresentationGenerateVariant): void => {
    gamma.reset()
    setModal({ kind: 'generate', variant })
  }

  if (reviewRequired && reviewStatus !== 'approved') {
    return (
      <div className="page-actions" style={{ flexWrap: 'wrap', gap: 8 }}>
        <PresentationReviewActions reviewRequired reviewStatus={reviewStatus} />
      </div>
    )
  }

  return (
    <div className="page-actions" style={{ flexWrap: 'wrap', gap: 8 }}>
      <button
        className="btn btn-primary"
        onClick={() =>
          anonDone
            ? setModal({ kind: 'regenerate', documentType: 'anoniem' })
            : openGenerate('teaser')
        }
        title={anonDone ? 'Klik om opnieuw aan te vragen (€ 199,-)' : undefined}
        type="button"
      >
        {anonDone ? (
          <>
            <CheckIcon />
            Anoniem verkoopprofiel — reeds gemaakt
          </>
        ) : (
          <>
            <DownloadIcon />
            Maak anoniem verkoopprofiel
          </>
        )}
      </button>

      <button
        className="btn btn-primary"
        onClick={() =>
          memoDone
            ? setModal({ kind: 'regenerate', documentType: 'memorandum' })
            : openGenerate('memorandum')
        }
        title={memoDone ? 'Klik om opnieuw aan te vragen (€ 199,-)' : undefined}
        type="button"
      >
        {memoDone ? (
          <>
            <CheckIcon />
            Verkoopmemorandum — reeds gemaakt
          </>
        ) : (
          <>
            <DownloadIcon />
            Maak verkoopmemorandum
          </>
        )}
      </button>

      {!reviewRequired && (
        <PresentationReviewActions
          reviewRequired={false}
          reviewStatus={reviewStatus}
        />
      )}

      {modal?.kind === 'generate' && (
        <GenerateDocumentModal
          gamma={gamma}
          onClose={closeModal}
          variant={modal.variant}
        />
      )}
      {modal?.kind === 'regenerate' && (
        <RegenerateRequestModal
          documentType={modal.documentType}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
