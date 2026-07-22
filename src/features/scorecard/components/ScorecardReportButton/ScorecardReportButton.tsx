'use client'

import { useRouter } from 'next/navigation'
import { useState, type FC } from 'react'

import { logSelfGeneratedDocument } from '@features/documents/actions'
import { ModalShell } from '@shared/components/ModalShell'
import { LOGO_DATA_URL } from '@shared/constants/logo'
import { useToastStore } from '@shared/store/toast'

import { requestReportRegeneration } from '../../actions'
import { IMPROVEMENT_REPORT_FILE_TYPE } from '../../constants/reportPdf'
import { buildImprovementReportData } from '../../lib/buildImprovementReportData'
import { buildImprovementReportPdf } from '../../lib/buildImprovementReportPdf'
import { ImprovementReportModal } from '../ImprovementReportModal'
import { type Props } from './types'

type ModalMode = 'generate' | 'regenerate' | null

export const ScorecardReportButton: FC<Props> = ({
  categories,
  companyName,
  reportInVault,
  sector,
  state,
  verbeterCount,
}) => {
  const router = useRouter()
  const showToast = useToastStore(store => store.showToast)
  const [modal, setModal] = useState<ModalMode>(null)
  const [isPending, setIsPending] = useState(false)

  const onGenerate = async (): Promise<void> => {
    setIsPending(true)

    try {
      const data = buildImprovementReportData(categories, state)

      if (data.totalPoints === 0) {
        showToast(
          'Geen verbeterpunten gevonden — alle beantwoorde vragen staan op "Volledig".',
          'error',
        )
        setModal(null)
        return
      }

      const pdf = buildImprovementReportPdf({
        companyName,
        data,
        logoDataUrl: LOGO_DATA_URL,
        sector,
      })
      const result = await logSelfGeneratedDocument({
        description: pdf.description,
        fileBase64: pdf.base64,
        fileName: pdf.fileName,
        fileType: IMPROVEMENT_REPORT_FILE_TYPE,
      })

      if (result.error) {
        showToast(result.error, 'error')
        return
      }

      showToast('Verbeterrapport opgeslagen in de Documentenkluis.')
      setModal(null)
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  const onRegenerate = async (): Promise<void> => {
    setIsPending(true)
    await requestReportRegeneration()
    setIsPending(false)
    setModal(null)
    showToast(
      'Je aanvraag is ontvangen. Een Osago-medewerker neemt binnen één werkdag contact op.',
    )
  }

  return (
    <>
      <button
        className="btn btn-primary"
        disabled={!reportInVault && verbeterCount === 0}
        onClick={() => setModal(reportInVault ? 'regenerate' : 'generate')}
        type="button"
      >
        {reportInVault
          ? 'Verbeterrapport — reeds gemaakt'
          : `Verbeterrapport (${verbeterCount})`}
      </button>

      {modal === 'generate' && (
        <ImprovementReportModal
          isPending={isPending}
          onClose={() => setModal(null)}
          onGenerate={() => void onGenerate()}
        />
      )}

      {modal === 'regenerate' && (
        <ModalShell
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setModal(null)}
                type="button"
              >
                Annuleren
              </button>
              <button
                className="btn btn-primary"
                disabled={isPending}
                onClick={() => void onRegenerate()}
                type="button"
              >
                Aanvragen
              </button>
            </>
          }
          onClose={() => setModal(null)}
          title="Opnieuw verbeterrapport aanmaken"
        >
          <div className="alert alert-amber" style={{ marginBottom: 16 }}>
            <strong style={{ color: '#92400E' }}>Let op:</strong> het
            verbeterrapport kan slechts één keer automatisch worden aangemaakt —
            die actie heb je al uitgevoerd. Het bestand staat nog beschikbaar in
            jouw Documentenkluis.
          </div>
          <p style={{ lineHeight: 1.6, margin: '0 0 12px' }}>
            Wil je het verbeterrapport toch opnieuw laten maken? Osago kan dat
            voor je verzorgen tegen <strong>€ 199,- eenmalig</strong>.
          </p>
          <p className="text-sm text-muted" style={{ margin: 0 }}>
            Na een aanvraag neemt een Osago-medewerker binnen één werkdag
            contact met je op.
          </p>
        </ModalShell>
      )}
    </>
  )
}
