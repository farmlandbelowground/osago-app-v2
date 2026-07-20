import { type ShareholderValueInputs } from '../types'

export const SHAREHOLDER_VALUE_MONTHS_MIN = 1
export const SHAREHOLDER_VALUE_MONTHS_MAX = 3
export const MONTHS_PER_YEAR = 12

export const DEFAULT_SHAREHOLDER_VALUE_INPUTS: ShareholderValueInputs = {
  bedrijfskostenV2: null,
  crediteurenV2: null,
  dcfreeExtrasV2: [],
  debiteurenV2: null,
  kortlopendeSchuldenV2: null,
  kostprijsOmzetV2: null,
  lastClosedBalanceYear: null,
  liquideMiddelenV2: null,
  totaleKostenMaandenV2: null,
  vakantiegeldV2: null,
  werkkapitaalExtrasV2: [],
}
