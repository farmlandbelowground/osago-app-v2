'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type FC } from 'react'

import { AdminResetButton } from '@shared/admin-reset'
import { GammaFlowModal, useGammaGeneration } from '@shared/gamma'
import { useToastStore } from '@shared/store/toast'

import {
  prepareValuationReportGamma,
  resetValuationPdfByAdmin,
} from '../../../actions'
import { type Props } from './types'

type Take5Variant = 'take5-beknopt' | 'take5-uitgebreid'

const NOUN: Record<Take5Variant, string> = {
  'take5-beknopt': 'Rapport T5',
  'take5-uitgebreid': 'Rapport T5 uitgebreid',
}

// "Rapport T5" (beknopt → Indicatief waarderingsrapport) + "Rapport T5
// uitgebreid" (Uitgebreid waarderingsrapport) + the "PDF resetten (medewerker)"
// reset. Both reports run the shared Gamma PDF flow (replacing the old client
// PptxGenJS deck, #65) and are stored in the Documentenkluis. Medewerker-only.
export const ValuationReportEmployeeTools: FC<Props> = ({ hasPdfInVault }) => {
  const router = useRouter()
  const gamma = useGammaGeneration()
  const showToast = useToastStore(state => state.showToast)
  const [variant, setVariant] = useState<Take5Variant | null>(null)
  const [isPreparing, setIsPreparing] = useState(false)

  useEffect(() => {
    if (gamma.phase === 'done') {
      router.refresh()
    }
  }, [gamma.phase, router])

  const onGenerate = async (next: Take5Variant): Promise<void> => {
    setVariant(next)
    gamma.reset()
    setIsPreparing(true)
    const prepared = await prepareValuationReportGamma(next)
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
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <button
        className="btn btn-secondary btn-medewerker"
        disabled={flowOpen}
        onClick={() => void onGenerate('take5-beknopt')}
        title="Alleen voor Osago-medewerkers — genereert het beknopte Take 5-rapport (Indicatief waarderingsrapport) en slaat het op in de Documentenkluis"
        type="button"
      >
        Rapport T5
      </button>
      <button
        className="btn btn-secondary btn-medewerker"
        disabled={flowOpen}
        onClick={() => void onGenerate('take5-uitgebreid')}
        title="Alleen voor Osago-medewerkers — genereert het uitgebreide Take 5-waarderingsrapport en slaat het op in de Documentenkluis"
        type="button"
      >
        Rapport T5 uitgebreid
      </button>
      {hasPdfInVault && (
        <AdminResetButton
          label="PDF resetten (medewerker)"
          resetAction={resetValuationPdfByAdmin}
          resetType="valuationPdf"
        />
      )}
      {flowOpen && (
        <GammaFlowModal
          busyOverride={isPreparing}
          doneDescription={
            <>
              Het rapport staat als <strong>PDF</strong> in de{' '}
              <strong>Documentenkluis</strong> van de klant.
            </>
          }
          gamma={gamma}
          onClose={() => gamma.reset()}
          titleNoun={variant ? NOUN[variant] : 'Take 5-rapport'}
        />
      )}
    </div>
  )
}
