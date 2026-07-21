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

import { computeDashboardTodos } from './lib/computeDashboardTodos'
import { type DashboardTodo } from './types'

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
