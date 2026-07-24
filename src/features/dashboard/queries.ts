import { getCompany } from '@features/company/queries'
import { DOCUMENT_PREFIXES, documentExistsByPrefix } from '@features/documents'
import { buyerDisplayName } from '@features/leads/lib/buyerDisplayName'
import { getCandidateLeads, getPipelineLeads } from '@features/leads/queries'
import { getPresentationData } from '@features/presentation/queries'
import { hasWerkruimteAccess } from '@features/subscriptions/lib/hasWerkruimteAccess'
import { getSubscription } from '@features/subscriptions/queries'
import { computeValuationProgress } from '@features/valuation/lib/computeValuationProgress'
import {
  type DashboardValuation,
  getCompanyValuationFields,
  getDashboardValuation as getValuationDashboardValuation,
  getFinancials,
  getValuationRecord,
  isValuationMade,
} from '@features/valuation/queries'

import { computeDashboardTodos } from './lib/computeDashboardTodos'
import { type DashboardTodo } from './types'

export const getDashboardTodos = async (
  userId: string,
): Promise<DashboardTodo[]> => {
  const [
    company,
    subscription,
    financials,
    valuationFields,
    valuationRecord,
    hasValuationPdfInVault,
    memoDone,
    anonDone,
    presentation,
    autoLeads,
    manualLeads,
    pipelineLeads,
  ] = await Promise.all([
    getCompany(userId),
    getSubscription(userId),
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
    getCandidateLeads(userId, 'auto_identified'),
    getCandidateLeads(userId, 'manual'),
    getPipelineLeads(userId),
  ])

  const valuationMade = isValuationMade(valuationRecord.result)

  const { financialsAnyValue, valueDriversComplete, valuationReportStarted } =
    computeValuationProgress({
      financials,
      hasValuationPdfInVault,
      valuationMade,
      valuationReport: valuationFields?.valuationReport ?? null,
      valueDriverAnswers: valuationFields?.valueDriverAnswers ?? {},
    })

  const valuationCanBeMade =
    financialsAnyValue && valueDriversComplete && valuationReportStarted

  const presentationFieldsFilled = Object.values(presentation.fields).some(
    value => typeof value === 'string' && value.trim() !== '',
  )
  const werkruimteUnlocked = memoDone && anonDone
  const newStageLeadNames = pipelineLeads
    .filter(lead => lead.stage === 'new')
    .map(buyerDisplayName)

  return computeDashboardTodos({
    anonDone,
    autoLeadStarted: autoLeads.length > 0,
    company,
    financialsAnyValue,
    hasValuationPdfInVault,
    hasWerkruimteAccess: hasWerkruimteAccess(subscription),
    manualLeadsCount: manualLeads.length,
    memoDone,
    newStageLeadNames,
    presentationFieldsFilled,
    subscription,
    valuationCanBeMade,
    valuationMade,
    valuationReportStarted,
    valueDriversComplete,
    werkruimteUnlocked,
  })
}

export const getDashboardValuation = async (
  userId: string,
): Promise<DashboardValuation | null> => getValuationDashboardValuation(userId)
