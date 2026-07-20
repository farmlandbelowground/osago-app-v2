import { type NonLegalEntityValuation } from '@features/valuation/types'

export interface Props {
  onChange: (patch: Partial<NonLegalEntityValuation>) => void
  value: NonLegalEntityValuation
}
