import { type Metadata } from 'next'

import { DOCUMENT_PREFIXES, documentExistsByPrefix } from '@features/documents'
import {
  PhotoSection,
  ValuationReportGenerateActions,
  getPresentationData,
} from '@features/presentation'
import {
  ValuationReportEditor,
  ValuationReportEmployeeTools,
  ValuationReportPrereqGate,
  computeValuationProgress,
  getCompanyValuationFields,
  getFinancials,
  getValuationRecord,
  isValuationMade,
} from '@features/valuation'
import { requireSession } from '@shared/auth/session'

const REPORT_PHOTO_TAB_ID = 'waarderingsrapport'

export const metadata: Metadata = {
  title: 'Waarderingsrapport',
}

export default async function WaarderingsrapportPage() {
  const session = await requireSession()
  const userId = session.user.id
  const isMedewerker = Boolean(session.impersonatedBy)

  const [
    fields,
    { result },
    financials,
    presentation,
    hasValuationPdfInVault,
    hasAnyReportPdfInVault,
  ] = await Promise.all([
    getCompanyValuationFields(userId),
    getValuationRecord(userId),
    getFinancials(userId),
    getPresentationData(userId),
    // Customer report ("Waarderingsrapport …") drives the customer button state…
    documentExistsByPrefix(userId, [DOCUMENT_PREFIXES.valuationReport]),
    // …while the medewerker reset also covers the Take 5 variants (#65).
    documentExistsByPrefix(userId, [
      DOCUMENT_PREFIXES.valuationReport,
      DOCUMENT_PREFIXES.valuationReportTake5Beknopt,
      DOCUMENT_PREFIXES.valuationReportTake5Uitgebreid,
    ]),
  ])

  const progress = computeValuationProgress({
    financials,
    hasValuationPdfInVault,
    valuationMade: isValuationMade(result),
    valuationReport: fields?.valuationReport ?? null,
    valueDriverAnswers: fields?.valueDriverAnswers ?? {},
  })

  // Medewerkers (impersonation) bypass the prereq gate for support purposes —
  // they may check the report text before the customer can proceed
  // (osago-bundle.js:15735).
  const gated =
    (!progress.valueDriversComplete || !progress.valuationMade) && !isMedewerker

  return (
    <main className="main">
      {gated || !fields ? (
        <ValuationReportPrereqGate
          valuationMade={progress.valuationMade}
          valueDriversComplete={progress.valueDriversComplete}
        />
      ) : (
        <ValuationReportEditor
          content={fields.valuationReport}
          footer={
            <div className="card" style={{ marginTop: 24 }}>
              <PhotoSection
                initialPhotos={presentation.photos[REPORT_PHOTO_TAB_ID] ?? []}
                tabId={REPORT_PHOTO_TAB_ID}
              />
            </div>
          }
          headerActions={
            <>
              <ValuationReportGenerateActions made={hasValuationPdfInVault} />
              {isMedewerker && progress.valuationMade && (
                <ValuationReportEmployeeTools
                  hasPdfInVault={hasAnyReportPdfInVault}
                />
              )}
            </>
          }
        />
      )}
    </main>
  )
}
