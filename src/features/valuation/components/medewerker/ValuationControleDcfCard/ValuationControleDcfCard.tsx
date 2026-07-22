'use client'

/* eslint-disable no-magic-numbers -- verbatim display port of
   renderValuationControleDcfCard (osago-bundle.js:15387); the percent/decimal
   formatters and table layout literals mirror the legacy card 1:1. */
import { type FC } from 'react'

import { exportDcfToPdf } from '../../../lib/dcfExportPdf'
import { dcfAllYears, dcfYearType } from '../../../lib/dcfExportShared'
import { exportDcfToXlsx } from '../../../lib/dcfExportXlsx'
import { type Props } from './types'

const fmtEuro = (value: number | null | undefined): string =>
  value === null || value === undefined || !isFinite(value)
    ? '—'
    : `€ ${Number(value).toLocaleString('nl-NL', { maximumFractionDigits: 0 })}`

const fmtPct = (value: number): string =>
  `${(value * 100).toFixed(2).replace('.', ',')}%`

const fmtDf = (value: number | null | undefined): string =>
  value === null || value === undefined || !isFinite(value)
    ? '—'
    : Number(value).toFixed(4).replace('.', ',')

// Ports renderValuationControleDcfCard (osago-bundle.js:15387) — read-only DCF
// derivation + the amber "DCF naar PDF"/"DCF naar Excel" export buttons. The
// exhaustive per-slider WACC rows are condensed to the subtotals; the full
// detail is available in the PDF/Excel exports (which are byte-faithful ports).
export const ValuationControleDcfCard: FC<Props> = ({ data }) => {
  const { result } = data
  const years = dcfAllYears(result)
  const row = (key: keyof (typeof result.berekening.data)[number]): string[] =>
    years.map(year => {
      const value = result.berekening.data[year]?.[key]
      return typeof value === 'number' ? fmtEuro(value) : '—'
    })

  return (
    <div className="card mt-5">
      <div
        style={{
          alignItems: 'flex-start',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 14,
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <div>
          <h3
            style={{
              alignItems: 'center',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              margin: '0 0 4px',
            }}
          >
            Controle DCF waardering
            <span className="medewerker-badge">Alleen voor medewerkers</span>
          </h3>
          <p className="desc" style={{ margin: 0 }}>
            Stap-voor-stap DCF-berekening zoals gebruikt door de slider en het
            dashboard. Zelfde inhoud als de PDF/Excel-export.
          </p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button
            className="btn btn-secondary btn-sm btn-medewerker"
            onClick={() => exportDcfToPdf(data)}
            type="button"
          >
            DCF naar PDF
          </button>
          <button
            className="btn btn-secondary btn-sm btn-medewerker"
            onClick={() => exportDcfToXlsx(data)}
            type="button"
          >
            DCF naar Excel
          </button>
        </div>
      </div>

      <div className="grid-2 grid" style={{ gap: 12, marginTop: 14 }}>
        <div className="text-sm">
          Disconto (rfr+mrp+sc+ip): <strong>{fmtPct(result.subtotaal1)}</strong>
        </div>
        <div className="text-sm">
          Kwetsbaarheid: <strong>{fmtPct(result.kleinPremie)}</strong>
        </div>
        <div className="text-sm">
          Risicoprofiel: <strong>{fmtPct(result.alfa)}</strong>
        </div>
        <div className="text-sm">
          Kostenvoet (WACC): <strong>{fmtPct(result.kostenvoet)}</strong>
        </div>
      </div>

      <div style={{ marginTop: 14, overflowX: 'auto' }}>
        <table style={{ fontSize: 12.5, minWidth: 560, width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Veld</th>
              {years.map(year => (
                <th key={year} style={{ textAlign: 'right' }}>
                  {year}
                  <div className="text-xs text-muted">
                    {dcfYearType(result, year)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(
              [
                ['Omzet', 'revenue'],
                ['EBITDA', 'ebitda'],
                ['Free cash flow', 'fcf'],
                ['Contante waarde FCF', 'cw'],
              ] as const
            ).map(([label, key]) => (
              <tr key={key}>
                <td>{label}</td>
                {row(key).map((cell, index) => (
                  <td key={years[index]} style={{ textAlign: 'right' }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td>Disconteringsvoet (DF)</td>
              {years.map(year => (
                <td key={year} style={{ textAlign: 'right' }}>
                  {fmtDf(result.berekening.data[year]?.df)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div
        style={{
          alignItems: 'baseline',
          background: 'var(--green-soft)',
          border: '1px solid #BBE0CB',
          borderRadius: 8,
          display: 'grid',
          gap: 14,
          gridTemplateColumns: '1fr auto',
          marginTop: 14,
          padding: '14px 12px',
        }}
      >
        <div
          style={{ color: 'var(--green-dark)', fontSize: 14, fontWeight: 700 }}
        >
          DCF Waarde (totaal)
        </div>
        <div
          style={{
            color: 'var(--green-dark)',
            fontSize: 18,
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 700,
            textAlign: 'right',
          }}
        >
          {fmtEuro(result.berekening.totalen.totaal)}
        </div>
      </div>
    </div>
  )
}
