import { LEGAL_FORM_OPTIONS } from '@features/company/constants'
import { type NonLegalEntityValuation } from '@features/valuation/types'

type LegalFormOption = (typeof LEGAL_FORM_OPTIONS)[number]

const EENMANSZAAK: LegalFormOption = 'Eenmanszaak'
const VOF: LegalFormOption = 'Vennootschap onder firma (V.O.F.)'

export const NON_LEGAL_ENTITY_FORMS: readonly string[] = [EENMANSZAAK, VOF]

export const NON_LEGAL_ENTITY_HOURS_MIN = 0
export const NON_LEGAL_ENTITY_HOURS_MAX = 40
export const NON_LEGAL_ENTITY_PARTNER_MIN = 1
export const NON_LEGAL_ENTITY_PARTNER_MAX = 20
export const NON_LEGAL_ENTITY_HOURS_DEFAULT = 40

export const NON_LEGAL_ENTITY_HOUR_TICKS = [0, 10, 20, 30, 40] as const

export const POSITION_PCT_SCALE = 100

export const DEFAULT_NON_LEGAL_ENTITY_VALUATION: NonLegalEntityValuation = {
  hasFixedIncome: true,
  hoursPerWeek: null,
  partnerCount: 1,
}
