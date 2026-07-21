import { getCompany } from '@features/company/queries'
import { getSubscription } from '@features/subscriptions/queries'
import { computeValuationProgress } from '@features/valuation/lib/computeValuationProgress'
import {
  getCompanyValuationFields,
  getEstimatedValue as getValuationEstimatedValue,
  getFinancials,
  getValuationRecord,
  isValuationMade,
} from '@features/valuation/queries'
import { getServerClient } from '@shared/supabase/server'

import { ACTIVE_CONVERSATION_STAGES } from './constants'
import { computeDashboardTodos } from './lib/computeDashboardTodos'
import { LeadPipelineRowSchema } from './schema'
import { type BuyerPipelineCounts, type DashboardTodo } from './types'

export const getDashboardTodos = async (
  userId: string,
): Promise<DashboardTodo[]> => {
  const [company, subscription, financials, valuationFields, valuationRecord] =
    await Promise.all([
      getCompany(userId),
      getSubscription(userId),
      getFinancials(userId),
      getCompanyValuationFields(userId),
      getValuationRecord(userId),
    ])

  const valuationMade = isValuationMade(valuationRecord.result)

  const { financialsAnyValue, valueDriversComplete, valuationReportStarted } =
    computeValuationProgress({
      financials,
      valuationMade,
      valuationReport: valuationFields?.valuationReport ?? null,
      valueDriverAnswers: valuationFields?.valueDriverAnswers ?? {},
    })

  const valuationCanBeMade =
    financialsAnyValue && valueDriversComplete && valuationReportStarted

  return computeDashboardTodos({
    company,
    financialsAnyValue,
    subscription,
    valuationCanBeMade,
    valuationMade,
    valuationReportStarted,
    valueDriversComplete,
  })
}

export const getEstimatedValue = async (
  userId: string,
): Promise<number | null> => getValuationEstimatedValue(userId)

export const getBuyerPipelineCounts = async (
  userId: string,
): Promise<BuyerPipelineCounts> => {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('leads')
    .select('stage')
    .eq('user_id', userId)
    .eq('lead_type', 'pipeline')

  if (error || !data) {
    return { activeConversations: 0, identifiedBuyers: 0 }
  }

  const stages = data
    .map(row => LeadPipelineRowSchema.safeParse(row))
    .filter(result => result.success)
    .map(result => result.data.stage)

  return {
    activeConversations: stages.filter(stage =>
      ACTIVE_CONVERSATION_STAGES.includes(stage),
    ).length,
    identifiedBuyers: stages.filter(stage => stage !== 'no_interest').length,
  }
}
