import { type Metadata } from 'next'

import { getCompany } from '@features/company/queries'
import {
  DEFAULT_DCF_NEW_INPUTS,
  DEFAULT_SHAREHOLDER_VALUE_INPUTS,
  FinancialsPageContent,
  MIJN_BEDRIJF_PATH,
  getCompanyValuationFields,
  getDcfAdminDefaults,
  getFinancials,
  getValuationMultiples,
} from '@features/valuation'
import { requireSession } from '@shared/auth/session'

export const metadata: Metadata = {
  title: 'Financiële gegevens',
}

export default async function FinancieleGegevensPage() {
  const session = await requireSession()

  const [company, fields, financials, valuationMultiples, dcfAdminDefaults] =
    await Promise.all([
      getCompany(session.user.id),
      getCompanyValuationFields(session.user.id),
      getFinancials(session.user.id),
      getValuationMultiples(),
      getDcfAdminDefaults(),
    ])

  const lastClosedYear = fields?.lastClosedYear ?? new Date().getFullYear() - 1

  return (
    <main className="main">
      <div className="page-header">
        <div>
          <h1 className="page-title">Financiële gegevens</h1>
        </div>
      </div>

      {!company?.sector && (
        <div className="alert alert-info mb-5">
          <strong>Tip:</strong> Vul eerst jouw bedrijfsprofiel onder{' '}
          <a
            href={MIJN_BEDRIJF_PATH}
            style={{ color: 'inherit', textDecoration: 'underline' }}
          >
            Mijn bedrijf
          </a>{' '}
          in voor een vollediger beeld bij waardebepaling en kopersmatching.
        </div>
      )}

      <FinancialsPageContent
        autoForecastDefault={fields?.autoForecast ?? true}
        bedrijfMarktOntwikkeling={company?.bedrijfMarktOntwikkeling ?? null}
        dcfAdminDefaults={dcfAdminDefaults}
        dcfNewInputs={fields?.dcfNewInputs ?? DEFAULT_DCF_NEW_INPUTS}
        initialYears={financials}
        lastClosedYear={lastClosedYear}
        legalForm={company?.legalForm ?? ''}
        nonLegalEntityDefault={fields?.nonLegalEntityConfig ?? null}
        normalizations={fields?.normalizations ?? []}
        sector={company?.sector ?? ''}
        shareholderValue={
          fields?.shareholderValue ?? DEFAULT_SHAREHOLDER_VALUE_INPUTS
        }
        valuationMultiples={valuationMultiples}
        valuationSettings={
          fields?.valuationSettings ?? {
            adjustHistoryWeights: false,
            dcfApplyEnabled: false,
            forecastIncluded: false,
            historyIncluded: false,
            manualMultipleEnabled: false,
            manualMultipleValue: null,
          }
        }
      />
    </main>
  )
}
