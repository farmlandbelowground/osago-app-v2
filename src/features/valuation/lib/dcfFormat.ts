// Dutch-locale DCF number formatting, ported from legacy dcfNewFmtNum3 /
// dcfNewFmtPct2 (osago-bundle.js:5298-5305) and the Uitgangspunten card's
// local fmtDecLocal (:5451-5452). Comma decimal separator, em-dash for
// non-finite values.

const PERCENT_MULTIPLIER = 100
const NUM3_DECIMALS = 3
const PCT2_DECIMALS = 2
const DEC4_DECIMALS = 4

const isFiniteNumber = (value: number | null | undefined): value is number =>
  typeof value === 'number' && isFinite(value)

export const formatDcfNum3 = (value: number | null | undefined): string =>
  isFiniteNumber(value) ? value.toFixed(NUM3_DECIMALS).replace('.', ',') : '—'

export const formatDcfPct2 = (value: number | null | undefined): string =>
  isFiniteNumber(value)
    ? `${(value * PERCENT_MULTIPLIER).toFixed(PCT2_DECIMALS).replace('.', ',')}%`
    : '—'

export const formatDcfDec4 = (value: number | null | undefined): string =>
  isFiniteNumber(value) ? value.toFixed(DEC4_DECIMALS).replace('.', ',') : '—'
