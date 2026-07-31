import { getCompany } from '@features/company/queries'
import { isCompanyProfileComplete } from '@features/dashboard/lib/computeDashboardTodos'
import { DOCUMENT_PREFIXES, documentExistsByPrefix } from '@features/documents'
import { getPresentationData } from '@features/presentation/queries'
import { computeValuationProgress } from '@features/valuation/lib/computeValuationProgress'
import {
  getCompanyValuationFields,
  getFinancials,
  getValuationRecord,
  isValuationMade,
} from '@features/valuation/queries'

import {
  computePreparationState,
  type ScreenDoneFlags,
} from './computePreparationState'
import { type PreparationState } from './types'

// Composite per-screen done-flags for the six prep screens (docx §3 table).
// Individual conditions are already derived inside computeValuationProgress
// and the document-existence checks — this aggregates them under the screen
// ids the sidebar + dashboard consume.
export const getPreparationState = async (
  userId: string,
): Promise<PreparationState> => {
  const [
    company,
    financials,
    valuationFields,
    valuationRecord,
    hasValuationPdfInVault,
    memoDone,
    anonDone,
    presentation,
  ] = await Promise.all([
    getCompany(userId),
    getFinancials(userId),
    getCompanyValuationFields(userId),
    getValuationRecord(userId),
    documentExistsByPrefix(userId, [DOCUMENT_PREFIXES.valuationReport]),
    documentExistsByPrefix(userId, [
      DOCUMENT_PREFIXES.memorandum,
      DOCUMENT_PREFIXES.informationMemorandum,
    ]),
    documentExistsByPrefix(userId, [DOCUMENT_PREFIXES.anonymousProfile]),
    getPresentationData(userId),
  ])

  const valuationMade = isValuationMade(valuationRecord.result)
  const { financialsAnyValue, valueDriversComplete } = computeValuationProgress(
    {
      financials,
      hasValuationPdfInVault,
      valuationMade,
      valuationReport: valuationFields?.valuationReport ?? null,
      valueDriverAnswers: valuationFields?.valueDriverAnswers ?? {},
    },
  )

  const kvkLinked = !!company?.kvkNummer
  const companyComplete = isCompanyProfileComplete(company)
  const presentationFieldsFilled = Object.values(presentation.fields).some(
    v => typeof v === 'string' && v.trim() !== '',
  )

  const flags: ScreenDoneFlags = {
    'financiele-gegevens': financialsAnyValue,
    'mijn-bedrijf': kvkLinked && companyComplete,
    presentatie: presentationFieldsFilled && memoDone && anonDone,
    'value-drivers': valueDriversComplete,
    waardebepaling: valuationMade,
    waarderingsrapport: hasValuationPdfInVault,
  }

  return computePreparationState(flags)
}
