import { redirect } from 'next/navigation'

import { DOCUMENT_PREFIXES, documentExistsByPrefix } from '@features/documents'
import { getSubscription } from '@features/subscriptions/queries'
import {
  DCF_SECTORCORRECTIE_BASE_MULTIPLE,
  DcfResultCard,
  FINANCIELE_GEGEVENS_PATH,
  MIJN_BEDRIJF_PATH,
  VALUATION_BAND_DEFAULT_PCT,
  ValuationLockGate,
  ValuationProgressTracker,
  ValuationResultCard,
  ValuationReviewStatusCard,
  computeIndicatieveOndernemingswaarde,
  computeValuationProgress,
  dcfNewCompute,
  getCompanyValuationFields,
  getDcfAdminDefaults,
  getShareholderValueAdjustment,
  getSmallEbitdaDeductions,
  getSmallOrgDeductions,
  getValuationMultiples,
  getValuationRecord,
  recomputeHeuristicValuation,
  resolveDcfNewInputs,
  resolveDisplayCompanyData,
} from '@features/valuation'
import { requireSession } from '@shared/auth/session'

export default async function WaardebepalingPage() {
  const session = await requireSession()

  await recomputeHeuristicValuation(session.user.id)

  const [resolved, liveFields, subscription, hasValuationPdfInVault] =
    await Promise.all([
      resolveDisplayCompanyData(session.user.id),
      getCompanyValuationFields(session.user.id),
      getSubscription(session.user.id),
      documentExistsByPrefix(session.user.id, [
        DOCUMENT_PREFIXES.valuationReport,
      ]),
    ])

  if (!resolved) {
    redirect(MIJN_BEDRIJF_PATH)
  }

  const progress = computeValuationProgress({
    financials: resolved.financialsList,
    hasValuationPdfInVault,
    valuationMade: resolved.made,
    valuationReport: liveFields?.valuationReport ?? null,
    valueDriverAnswers: resolved.valueDriverAnswers,
  })

  if (!resolved.sector) {
    redirect(MIJN_BEDRIJF_PATH)
  }
  if (!progress.financialsAnyValue) {
    redirect(FINANCIELE_GEGEVENS_PATH)
  }

  const [
    valuationMultiples,
    dcfAdminDefaults,
    smallEbitdaDeductions,
    smallOrgDeductions,
  ] = await Promise.all([
    getValuationMultiples(),
    getDcfAdminDefaults(),
    getSmallEbitdaDeductions(),
    getSmallOrgDeductions(),
  ])

  const indicativeResult = computeIndicatieveOndernemingswaarde({
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

  const { result: heuristicResult } = await getValuationRecord(session.user.id)

  const enterpriseValue =
    indicativeResult.value !== null
      ? indicativeResult.value
      : Math.round(heuristicResult?.dcfValue ?? 0)

  const verrekeningValue = await getShareholderValueAdjustment(session.user.id)
  const shareholderValue = enterpriseValue + verrekeningValue

  const valuationBand =
    resolved.valuationBand ??
    Math.ceil(enterpriseValue * VALUATION_BAND_DEFAULT_PCT)
  const bandLow = enterpriseValue - valuationBand
  const bandHigh = enterpriseValue + valuationBand
  const ashLow = shareholderValue - valuationBand
  const ashHigh = shareholderValue + valuationBand

  const dcfResult = resolved.dcfApplyEnabled
    ? dcfNewCompute(
        resolveDcfNewInputs(
          resolved.dcfNewInputs,
          dcfAdminDefaults,
          indicativeResult.sectorMultipleRaw ??
            DCF_SECTORCORRECTIE_BASE_MULTIPLE,
        ),
        resolved.financials,
        resolved.normalizations,
      )
    : null

  const requiresReview = subscription?.type === 'valuation-premium'
  const reviewStatus = liveFields?.valuationReview?.status ?? 'none'

  return (
    <main className="main">
      <div className="page-header">
        <div>
          <h1 className="page-title">Waardebepaling</h1>
        </div>
      </div>

      {resolved.made && <ValuationProgressTracker progress={progress} />}

      <ValuationLockGate isMade={resolved.made}>
        {dcfResult ? (
          <DcfResultCard
            ashHigh={ashHigh}
            ashLow={ashLow}
            bandHigh={bandHigh}
            bandLow={bandLow}
            dcfResult={dcfResult}
            enterpriseValue={enterpriseValue}
            shareholderValue={shareholderValue}
          />
        ) : (
          <ValuationResultCard
            ashHigh={ashHigh}
            ashLow={ashLow}
            bandHigh={bandHigh}
            bandLow={bandLow}
            enterpriseValue={enterpriseValue}
            indicativeResult={indicativeResult}
            shareholderValue={shareholderValue}
          />
        )}
      </ValuationLockGate>

      <ValuationReviewStatusCard
        requiresReview={requiresReview}
        reviewStatus={reviewStatus}
      />
    </main>
  )
}
