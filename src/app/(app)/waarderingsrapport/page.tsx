import { DOCUMENT_PREFIXES, documentExistsByPrefix } from '@features/documents'
import {
  PhotoSection,
  ValuationReportGenerateActions,
  getPresentationData,
} from '@features/presentation'
import {
  ValuationReportEditor,
  ValuationReportPrereqGate,
  computeValuationProgress,
  getCompanyValuationFields,
  getFinancials,
  getValuationRecord,
  isValuationMade,
} from '@features/valuation'
import { requireSession } from '@shared/auth/session'

const REPORT_PHOTO_TAB_ID = 'waarderingsrapport'

export default async function WaarderingsrapportPage() {
  const session = await requireSession()
  const userId = session.user.id

  const [fields, { result }, financials, presentation, hasValuationPdfInVault] =
    await Promise.all([
      getCompanyValuationFields(userId),
      getValuationRecord(userId),
      getFinancials(userId),
      getPresentationData(userId),
      documentExistsByPrefix(userId, [DOCUMENT_PREFIXES.valuationReport]),
    ])

  const progress = computeValuationProgress({
    financials,
    hasValuationPdfInVault,
    valuationMade: isValuationMade(result),
    valuationReport: fields?.valuationReport ?? null,
    valueDriverAnswers: fields?.valueDriverAnswers ?? {},
  })

  const gated = !progress.valueDriversComplete || !progress.valuationMade

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
            <ValuationReportGenerateActions made={hasValuationPdfInVault} />
          }
        />
      )}
    </main>
  )
}
