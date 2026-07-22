import { documentExistsByPrefix } from '@features/documents'
import { DOCUMENT_PREFIXES } from '@features/documents'
import { requireSession } from '@shared/auth/session'
import { getServerClient } from '@shared/supabase/server'

import { CompanyScorecardRowSchema, type ScorecardState } from './schema'
import { type ScorecardCompanyInput } from './types'

export interface ScorecardCompanyData {
  company: ScorecardCompanyInput
  reportInVault: boolean
  state: ScorecardState
}

// Under impersonation the session IS the customer, so this reads the current
// user's own `companies` row under customer RLS (no targetUserId/service-role).
export const getScorecardCompany = async (): Promise<ScorecardCompanyData> => {
  const session = await requireSession()
  const supabase = await getServerClient()

  const { data } = await supabase
    .from('companies')
    .select('legal_form, name, sector, extra, user_id')
    .eq('user_id', session.user.id)
    .maybeSingle()

  const parsed = data ? CompanyScorecardRowSchema.safeParse(data) : null
  const row = parsed?.success ? parsed.data : null

  const company: ScorecardCompanyInput = {
    employees: row?.extra.employees ?? null,
    legalForm: row?.legal_form ?? null,
    name: row?.name ?? null,
    sector: row?.sector ?? null,
  }

  const reportInVault = await documentExistsByPrefix(session.user.id, [
    DOCUMENT_PREFIXES.improvementReport,
  ])

  return { company, reportInVault, state: row?.extra.scorecard ?? {} }
}
