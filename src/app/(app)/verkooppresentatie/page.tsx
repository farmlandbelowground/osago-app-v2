import { redirect } from 'next/navigation'

import { MIJN_BEDRIJF_PATH } from '@features/company/constants'
import { getCompany } from '@features/company/queries'
import { DOCUMENT_PREFIXES, documentExistsByPrefix } from '@features/documents'
import {
  PresentationBuilder,
  PresentationGenerateActions,
  PresentationMissingDataGate,
  getPresentationData,
} from '@features/presentation'
import {
  firstAllowedCustomerPage,
  getAllowedCustomerPages,
} from '@features/subscriptions/lib/customerAccess'
import { hasWerkruimteAccess } from '@features/subscriptions/lib/hasWerkruimteAccess'
import { getSubscription } from '@features/subscriptions/queries'
import { FINANCIELE_GEGEVENS_PATH, getFinancials } from '@features/valuation'
import { type FinancialYearInput } from '@features/valuation/types'
import { requireSession } from '@shared/auth/session'

const hasAnyFinancialValue = (financials: FinancialYearInput[]): boolean =>
  financials.some(
    row =>
      row.revenue !== null ||
      row.cogs !== null ||
      row.operatingExpenses !== null ||
      row.depreciation !== null ||
      row.interest !== null ||
      row.taxesPaid !== null,
  )

export default async function VerkooppresentatiePage() {
  const session = await requireSession()
  const userId = session.user.id

  const subscription = await getSubscription(userId)
  if (!hasWerkruimteAccess(subscription)) {
    redirect(firstAllowedCustomerPage(getAllowedCustomerPages(subscription)))
  }

  const [company, financials, presentation, memoDone, anonDone] =
    await Promise.all([
      getCompany(userId),
      getFinancials(userId),
      getPresentationData(userId),
      documentExistsByPrefix(userId, [DOCUMENT_PREFIXES.memorandum]),
      documentExistsByPrefix(userId, [DOCUMENT_PREFIXES.anonymousProfile]),
    ])

  const profileMissing = !company?.sector || company.description.trim() === ''
  const financialsMissing = !hasAnyFinancialValue(financials)

  if (profileMissing || financialsMissing) {
    if (profileMissing && financialsMissing) {
      return (
        <PresentationMissingDataGate
          ctaHref={MIJN_BEDRIJF_PATH}
          ctaLabel="Naar bedrijfsprofiel"
          message="Vul eerst jouw bedrijfsprofiel en financiën in."
        />
      )
    }
    if (profileMissing) {
      return (
        <PresentationMissingDataGate
          ctaHref={MIJN_BEDRIJF_PATH}
          ctaLabel="Naar bedrijfsprofiel"
          message="Vul eerst de sector en omschrijving in op jouw bedrijfsprofiel."
        />
      )
    }
    return (
      <PresentationMissingDataGate
        ctaHref={FINANCIELE_GEGEVENS_PATH}
        ctaLabel="Naar financiën"
        message="Vul eerst de jaaromzet in onder Financiën."
      />
    )
  }

  const reviewRequired =
    subscription?.type === 'plus' || subscription?.type === 'premium'

  return (
    <main className="main">
      <div className="page-header">
        <div>
          <h1 className="page-title">Presentatie</h1>
        </div>
        <PresentationGenerateActions
          anonDone={anonDone}
          memoDone={memoDone}
          reviewRequired={reviewRequired}
          reviewStatus={presentation.reviewStatus}
        />
      </div>

      <PresentationBuilder
        data={presentation}
        prefill={{
          description: company.description,
          reasonForSale: company.reasonForSale,
          usp: company.usp,
        }}
      />
    </main>
  )
}
