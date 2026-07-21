import { TAKE5_SCORECARD } from '../constants/questions'
import {
  SCORECARD_BV_NV_LEGAL_FORMS,
  SCORECARD_PERSONNEL_QUESTION_IDS,
  SCORECARD_SHAREHOLDER_QUESTION_IDS,
  SCORECARD_TAB_HIDDEN_BY_SECTOR,
} from '../constants/visibility'
import { type ScorecardCategory, type ScorecardCompanyInput } from '../types'

// Returns the scorecard filtered for the active company: sector-irrelevant
// categories dropped; the HRM category + scattered personnel questions hidden
// when there is no personnel; shareholder questions hidden when the legal form
// has no shares. Stored answers to now-hidden questions are never removed —
// the filter is presentational only (osago-bundle.js:6923-6941, spec §3.6).
export const getFilteredScorecard = (
  company: ScorecardCompanyInput,
): ScorecardCategory[] => {
  const sector = company.sector ?? ''
  const employees = Number(company.employees ?? 0)
  const legalForm = company.legalForm ?? ''
  const hasPersonnel = employees > 0
  const hasShares = SCORECARD_BV_NV_LEGAL_FORMS.has(legalForm)
  const hiddenTabs = new Set<string>(
    SCORECARD_TAB_HIDDEN_BY_SECTOR[sector] ?? [],
  )
  if (!hasPersonnel) {
    hiddenTabs.add('hrm')
  }

  return TAKE5_SCORECARD.filter(category => !hiddenTabs.has(category.id)).map(
    category => ({
      ...category,
      items: category.items.filter(item => {
        if (!hasPersonnel && SCORECARD_PERSONNEL_QUESTION_IDS.has(item.id)) {
          return false
        }
        if (!hasShares && SCORECARD_SHAREHOLDER_QUESTION_IDS.has(item.id)) {
          return false
        }
        return true
      }),
    }),
  )
}
