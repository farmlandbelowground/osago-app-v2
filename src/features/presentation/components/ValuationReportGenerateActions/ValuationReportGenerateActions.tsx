'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type CSSProperties, type FC } from 'react'

import { prepareValuationReportGamma } from '@features/valuation/actions'
import { GammaFlowModal, useGammaGeneration } from '@shared/gamma'
import { useToastStore } from '@shared/store/toast'

import { RegenerateRequestModal } from '../RegenerateRequestModal'
import { type Props } from './types'

const TITLE_NOUN = 'Waarderingsrapport'
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

// Ports the /waarderingsrapport generate action (osago-bundle.js:19913-20008 +
// the report-page button). Lives in features/presentation — not features/valuation
// — because it composes valuation's prepare action with presentation's
// RegenerateRequestModal, and presentation already depends on valuation (the
// reverse import would be circular). Unlike the memorandum, there is no
// one-time-action confirm; the pre-flight "valuation must be made" guard runs
// server-side in prepareValuationReportGamma.
export const ValuationReportGenerateActions: FC<Props> = ({ made }) => {
  const router = useRouter()
  const gamma = useGammaGeneration()
  const showToast = useToastStore(state => state.showToast)
  const [showRegenerate, setShowRegenerate] = useState(false)
  const [isPreparing, setIsPreparing] = useState(false)

  useEffect(() => {
    if (gamma.phase === 'done') {
      router.refresh()
    }
  }, [gamma.phase, router])

  const onGenerate = async (): Promise<void> => {
    setIsPreparing(true)
    const prepared = await prepareValuationReportGamma()
    setIsPreparing(false)
    if (prepared.error !== null) {
      showToast(prepared.error, 'error')
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
      variant: 'valuation',
    })
  }

  const flowOpen = isPreparing || gamma.phase !== 'idle'

  return (
    <div className="page-actions" style={{ flexWrap: 'wrap', gap: 8 }}>
      {made ? (
        <button
          className="btn btn-primary"
          onClick={() => setShowRegenerate(true)}
          title="Klik om opnieuw aan te vragen (€ 199,-)"
          type="button"
        >
          <CheckIcon />
          Waarderingsrapport — reeds gemaakt
        </button>
      ) : (
        <button
          className="btn btn-primary"
          disabled={isPreparing}
          onClick={() => void onGenerate()}
          type="button"
        >
          <DownloadIcon />
          Maak waarderingsrapport
        </button>
      )}

      {flowOpen && (
        <GammaFlowModal
          busyOverride={isPreparing}
          doneDescription={
            <>
              Het rapport staat als <strong>PDF</strong> in jouw{' '}
              <strong>Documentenkluis</strong>. Controleer de inhoud; wil je
              iets wijzigen, pas dan de velden in de app aan en genereer het
              rapport opnieuw — jij bent zelf verantwoordelijk voor het gebruik
              ervan.
            </>
          }
          gamma={gamma}
          onClose={() => gamma.reset()}
          titleNoun={TITLE_NOUN}
        />
      )}

      {showRegenerate && (
        <RegenerateRequestModal
          documentType="waarderingsrapport"
          onClose={() => setShowRegenerate(false)}
        />
      )}
    </div>
  )
}
