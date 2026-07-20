'use client'

import { type FC } from 'react'

import { type FinancialYearInput } from '@features/valuation/types'
import { cn } from '@shared/utils/cn'

import { CONFIDENCE_BADGE_CLASS, CONFIDENCE_LABEL } from './constants'
import { type Props } from './types'

const formatAmount = (value: number | null): string =>
  value === null ? '—' : `€ ${value.toLocaleString('nl-NL')}`

const EXTRACTION_COLUMNS: Array<{
  field: keyof Omit<FinancialYearInput, 'year'>
  label: string
}> = [
  { field: 'revenue', label: 'Omzet' },
  { field: 'cogs', label: 'Kostprijs omzet' },
  { field: 'operatingExpenses', label: 'Operationele kosten' },
  { field: 'depreciation', label: 'Afschrijvingen' },
  { field: 'interest', label: 'Rentelasten' },
  { field: 'taxesPaid', label: 'Betaalde belastingen' },
]

export const FinancialsExtractionReviewPanel: FC<Props> = ({
  displayYears,
  extraction,
  onApply,
  onDismiss,
}) => {
  const inWindowYears = extraction.years.filter(row =>
    displayYears.includes(row.year),
  )
  const outOfWindowYears = extraction.years.filter(
    row => !displayYears.includes(row.year),
  )

  const onApplyClick = (): void => {
    onApply(inWindowYears)
  }

  return (
    <div className="card">
      <div className="flex-between mb-3 flex">
        <h3 className="form-section-title">Herkende financiële gegevens</h3>
        <span
          className={cn('badge', CONFIDENCE_BADGE_CLASS[extraction.confidence])}
        >
          Betrouwbaarheid: {CONFIDENCE_LABEL[extraction.confidence]}
        </span>
      </div>

      {extraction.currencyNote && (
        <p className="text-muted text-sm mb-3">{extraction.currencyNote}</p>
      )}

      <div className="fin-table-wrap">
        <table className="fin-table">
          <thead>
            <tr>
              <th>Jaar</th>
              {EXTRACTION_COLUMNS.map(column => (
                <th key={column.field}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {extraction.years.map(row => (
              <tr key={row.year}>
                <td className="fin-row-label">{row.year}</td>
                {EXTRACTION_COLUMNS.map(column => (
                  <td className="fin-cell" key={column.field}>
                    {formatAmount(row[column.field])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {outOfWindowYears.length > 0 && (
        <div className="alert alert-info mt-3">
          {outOfWindowYears
            .map(
              row =>
                `Jaar ${row.year} valt buiten de huidige tabelweergave en is overgeslagen.`,
            )
            .join(' ')}
        </div>
      )}

      <div className="gap-3 mt-4 flex">
        <button
          className="btn btn-primary"
          onClick={onApplyClick}
          type="button"
        >
          Toepassen in tabel
        </button>
        <button className="btn btn-secondary" onClick={onDismiss} type="button">
          Negeren
        </button>
      </div>
    </div>
  )
}
