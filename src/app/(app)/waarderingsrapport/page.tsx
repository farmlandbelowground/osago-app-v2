import { getCompany } from '@features/company/queries'
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
  computeIndicatieveOndernemingswaarde,
  computeValuationProgress,
  getCompanyValuationFields,
  getFinancials,
  getShareholderValueAdjustment,
  getSmallEbitdaDeductions,
  getSmallOrgDeductions,
  getValuationMultiples,
  getValuationRecord,
  isValuationMade,
  resolveDisplayCompanyData,
  type T5DeckData,
} from '@features/valuation'
import { computeValueDriverSectionScores } from '@features/valuation/lib/computeValueDriverSectionScores'
import { requireSession } from '@shared/auth/session'

const REPORT_PHOTO_TAB_ID = 'waarderingsrapport'

export default async function WaarderingsrapportPage() {
  const session = await requireSession()
  const userId = session.user.id
  const isMedewerker = Boolean(session.impersonatedBy)

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

  // Medewerkers (impersonation) bypass the prereq gate for support purposes —
  // they may check the report text before the customer can proceed
  // (osago-bundle.js:15735).
  const gated =
    (!progress.valueDriversComplete || !progress.valuationMade) &&
    !isMedewerker

  // Build the Take 5 deck data only for an impersonating employee.
  let deckData: T5DeckData | null = null
  if (isMedewerker && fields) {
    const resolved = await resolveDisplayCompanyData(userId)

    if (resolved) {
      const [
        valuationMultiples,
        smallEbitdaDeductions,
        smallOrgDeductions,
        company,
        verrekening,
      ] = await Promise.all([
        getValuationMultiples(),
        getSmallEbitdaDeductions(),
        getSmallOrgDeductions(),
        getCompany(userId),
        getShareholderValueAdjustment(userId),
      ])

      const indicative = computeIndicatieveOndernemingswaarde({
        employees: resolved.employees,
        fin: resolved.financials,
        historyWeightOverrides: {},
        lastClosedYear: resolved.lastClosedYear,
        nonLegalEntityConfig: resolved.nonLegalEntityConfig,
        normalizations: resolved.normalizations,
        sector: resolved.sector,
        smallEbitdaDeductions,
        smallOrgDeductions,
        valuationMultiples,
        valuationSettings: resolved.valuationSettings,
      })

      const enterprise = indicative.value ?? 0
      const shareholder = enterprise + verrekening

      deckData = {
        companyName: company?.name ?? '',
        // NOTE: the shareholder breakdown split (werkkapitaal vs debt/cash-free)
        // is approximated here — only the total adjustment is exposed by
        // getShareholderValueAdjustment; the per-component split needs the
        // breakdown helper. The total (and thus the deck's aandeelhouderswaarde)
        // is exact; the split line is indicative. Flagged for follow-up.
        dcfree: 0,
        enterprise,
        financials: resolved.financials,
        report: {
          closing: fields.valuationReport?.closing ?? '',
          financialsNote: fields.valuationReport?.financialsNote ?? '',
          foreword: fields.valuationReport?.foreword ?? '',
          valueDriversNote: fields.valuationReport?.valueDriversNote ?? '',
        },
        sector: resolved.sector ?? '',
        shareholder,
        useShareholder: shareholder >= enterprise,
        userName: [session.firstName, session.lastName]
          .filter(Boolean)
          .join(' '),
        valuationBand: resolved.valuationBand,
        valueDriverScores: computeValueDriverSectionScores(
          resolved.valueDriverAnswers,
        ),
        werkkap: verrekening,
      }
    }
  }

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
              {isMedewerker && deckData && progress.valuationMade && (
                <ValuationReportEmployeeTools
                  deckData={deckData}
                  hasPdfInVault={hasValuationPdfInVault}
                />
              )}
            </>
          }
        />
      )}
    </main>
  )
}
