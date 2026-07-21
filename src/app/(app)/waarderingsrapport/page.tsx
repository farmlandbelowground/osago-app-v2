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

export default async function WaarderingsrapportPage() {
  const session = await requireSession()
  const userId = session.user.id

  const [fields, { result }, financials] = await Promise.all([
    getCompanyValuationFields(userId),
    getValuationRecord(userId),
    getFinancials(userId),
  ])

  const progress = computeValuationProgress({
    financials,
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
        <ValuationReportEditor content={fields.valuationReport} />
      )}
    </main>
  )
}
