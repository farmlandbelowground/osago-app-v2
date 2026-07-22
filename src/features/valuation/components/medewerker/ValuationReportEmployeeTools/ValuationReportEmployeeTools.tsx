'use client'

import { useState, type FC } from 'react'

import { AdminResetButton } from '@shared/admin-reset'
import { useToastStore } from '@shared/store/toast'

import { resetValuationPdfByAdmin } from '../../../actions'
import { buildValuationPptxT5 } from '../../../lib/buildValuationPptxT5'
import { type Props } from './types'

// "Rapport T5" + "Rapport T5 uitgebreid" (both call the same builder — the
// "uitgebreid" variant is an identical stub, intended to diverge with extra
// slides in future, D-G) + the "PDF resetten (medewerker)" reset. All amber,
// medewerker-only.
export const ValuationReportEmployeeTools: FC<Props> = ({
  deckData,
  hasPdfInVault,
}) => {
  const showToast = useToastStore(state => state.showToast)
  const [isBusy, setIsBusy] = useState(false)

  const onGenerate = async (): Promise<void> => {
    setIsBusy(true)
    try {
      await buildValuationPptxT5(deckData)
      showToast('Take 5-rapport gedownload als PowerPoint.')
    } catch {
      showToast('Genereren van het Take 5-rapport is mislukt.', 'error')
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <button
        className="btn btn-secondary btn-medewerker"
        disabled={isBusy}
        onClick={() => void onGenerate()}
        type="button"
      >
        Rapport T5
      </button>
      <button
        className="btn btn-secondary btn-medewerker"
        disabled={isBusy}
        onClick={() => void onGenerate()}
        title="In ontwikkeling — produceert momenteel hetzelfde rapport"
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
    </div>
  )
}
