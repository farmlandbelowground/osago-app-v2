import { formatGammaInt } from '@shared/gamma'

import { type FinancialYearInput } from '../types'

// Multi-year financials table as markdown (Gamma-native). Only real, closed
// years (before this calendar year) — no forecast. Shared by the valuation
// report and the IM valuation addendum. Ports buildFinancialsTableMd
// (osago-bundle.js #65). Returns '' when there are no closed years.
export const buildFinancialsTableMd = (
  financials: Record<number, FinancialYearInput>,
  currentYear: number,
): string => {
  const eur = (value: number): string => `€ ${formatGammaInt(value)}`
  const years = Object.keys(financials)
    .map(year => parseInt(year, 10))
    .filter(year => !isNaN(year) && year < currentYear)
    .sort((a, b) => a - b)

  if (years.length === 0) {
    return ''
  }

  const row = (
    label: string,
    pick: (f: FinancialYearInput) => number,
  ): string =>
    `| ${label} | ` +
    years.map(year => eur(pick(financials[year]))).join(' | ') +
    ' |'

  return [
    '| Post | ' + years.join(' | ') + ' |',
    '| --- |' + years.map(() => ' --- |').join(''),
    row('Omzet', f => Number(f.revenue) || 0),
    row('Kostprijs van de omzet', f => Number(f.cogs) || 0),
    row('Bedrijfskosten', f => Number(f.operatingExpenses) || 0),
    row(
      'EBITDA',
      f =>
        (Number(f.revenue) || 0) -
        (Number(f.cogs) || 0) -
        (Number(f.operatingExpenses) || 0),
    ),
  ].join('\n')
}
