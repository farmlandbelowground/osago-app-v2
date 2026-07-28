import { type Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getCompany } from '@features/company/queries'
import { getSubscription } from '@features/subscriptions/queries'
import {
  DCF_SECTORCORRECTIE_BASE_MULTIPLE,
  DcfResultCard,
  FINANCIELE_GEGEVENS_PATH,
  MIJN_BEDRIJF_PATH,
  MethodeToelichtingCard,
  VALUATION_BAND_DEFAULT_PCT,
  ValuationBandCard,
  ValuationControleCard,
  ValuationControleDcfCard,
  ValuationDisclaimer,
  ValuationLockGate,
  ValuationRangeCard,
  buildHistoryWeightOverrides,
  computeIndicatieveOndernemingswaarde,
  dcfNewCompute,
  getCompanyValuationFields,
  getDcfAdminDefaults,
  getShareholderValueAdjustment,
  getSmallEbitdaDeductions,
  getSmallOrgDeductions,
  getValuationMultiples,
  getValuationRecord,
  hasAnyFinancialValue,
  isNonLegalEntityForm,
  recomputeHeuristicValuation,
  resetValuationByAdmin,
  resolveDcfNewInputs,
  resolveDisplayCompanyData,
} from '@features/valuation'
import { AdminResetButton } from '@shared/admin-reset'
import { requireSession } from '@shared/auth/session'

export const metadata: Metadata = {
  title: 'Waardebepaling',
}

// Ports renderValuation (osago-bundle.js:14843-15124). Section order, wording
// and the medewerker-only blocks follow legacy exactly.
export default async function WaardebepalingPage() {
  const session = await requireSession()

  await recomputeHeuristicValuation(session.user.id)

  const [resolved, liveFields, subscription] = await Promise.all([
    resolveDisplayCompanyData(session.user.id),
    getCompanyValuationFields(session.user.id),
    getSubscription(session.user.id),
  ])

  if (!resolved) {
    redirect(MIJN_BEDRIJF_PATH)
  }
  if (!resolved.sector) {
    redirect(MIJN_BEDRIJF_PATH)
  }
  if (!hasAnyFinancialValue(resolved.financialsList)) {
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
    historyWeightOverrides: buildHistoryWeightOverrides(resolved.financials),
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

  const dcfInputs = resolved.dcfApplyEnabled
    ? resolveDcfNewInputs(
        resolved.dcfNewInputs,
        dcfAdminDefaults,
        indicativeResult.sectorMultipleRaw ?? DCF_SECTORCORRECTIE_BASE_MULTIPLE,
      )
    : null

  const dcfResult = dcfInputs
    ? dcfNewCompute(dcfInputs, resolved.financials, resolved.normalizations)
    : null

  // Legacy quirk (renderDcfNewWaardebepalingBlockV2, :5666-5674): the DCF card
  // falls back to a default derived from the DCF total, while the other
  // sliders default off the enterprise value. Only a saved band unifies them.
  const dcfBand =
    dcfResult !== null
      ? (resolved.valuationBand ??
        Math.ceil(
          dcfResult.berekening.totalen.totaal * VALUATION_BAND_DEFAULT_PCT,
        ))
      : 0

  const requiresReview = subscription?.type === 'valuation-premium'
  const reviewStatus = liveFields?.valuationReview?.status ?? 'none'

  // Employee-only ("medewerker") controls, rendered only while impersonating.
  const isMedewerker = Boolean(session.impersonatedBy)
  const companyForExport = isMedewerker
    ? await getCompany(session.user.id)
    : null

  return (
    <main className="main">
      <div className="page-header">
        <div>
          <h1 className="page-title">Waardebepaling</h1>
        </div>
        <div className="page-actions">
          {resolved.made && isMedewerker && (
            <AdminResetButton
              label="Waardering resetten (medewerker)"
              resetAction={resetValuationByAdmin}
              resetType="valuation"
            />
          )}
        </div>
      </div>

      <ValuationLockGate
        isMade={resolved.made}
        isMedewerker={isMedewerker}
        requiresReview={requiresReview}
        reviewStatus={reviewStatus}
      >
        {dcfResult ? (
          <DcfResultCard
            band={dcfBand}
            totalen={dcfResult.berekening.totalen}
          />
        ) : (
          <ValuationRangeCard
            band={valuationBand}
            idSuffix="v2"
            isLive
            mid={enterpriseValue}
            title="Indicatieve ondernemingswaarde"
          />
        )}

        {!isNonLegalEntityForm(resolved.legalForm ?? '') && (
          <ValuationRangeCard
            band={valuationBand}
            idSuffix="ash"
            isLive
            mid={shareholderValue}
            title="Indicatieve aandeelhouderswaarde"
          />
        )}

        <div className="grid grid-2">
          <MethodeToelichtingCard
            input={{
              dcf: dcfInputs
                ? {
                    groeiRest: dcfInputs.uitgangspunten.groeiRest,
                    kostenvoet: dcfResult?.kostenvoet ?? 0,
                    scenarioStartYear: dcfInputs.scenarioStartYear,
                    scenarioYearCount: dcfInputs.scenarioYearCount,
                    vermogensvoetRest:
                      dcfInputs.uitgangspunten.vermogensvoetRest,
                  }
                : null,
              dcfApplyEnabled: resolved.dcfApplyEnabled,
              indicative: indicativeResult,
              normalizations: resolved.normalizations,
              sector: resolved.sector,
            }}
          />

          <ValuationBandCard initialBand={valuationBand} />
        </div>

        {isMedewerker &&
          (dcfResult && dcfInputs ? (
            <ValuationControleDcfCard
              data={{
                company: {
                  bedrijfMarktOntwikkeling: null,
                  dcfApplyEnabled: resolved.dcfApplyEnabled,
                  kvkNummer: companyForExport?.kvkNummer ?? null,
                  lastClosedYear: resolved.lastClosedYear,
                  name: companyForExport?.name ?? '',
                  sector: resolved.sector,
                },
                financials: resolved.financials,
                inputs: dcfInputs,
                result: dcfResult,
              }}
            />
          ) : (
            <ValuationControleCard result={indicativeResult} />
          ))}
      </ValuationLockGate>

      <ValuationDisclaimer />
    </main>
  )
}
