import { type FC } from 'react'

import { type Props } from './types'

const formatEuro = (value: number): string =>
  `€ ${Math.round(value).toLocaleString('nl-NL')}`

export const ValuationResultCard: FC<Props> = ({
  ashHigh,
  ashLow,
  bandHigh,
  bandLow,
  enterpriseValue,
  indicativeResult,
  shareholderValue,
}) => {
  return (
    <>
      <div className="valuation-result">
        <div className="label">Indicatieve ondernemingswaarde</div>
        <div className="value">{formatEuro(enterpriseValue)}</div>
        <div className="range">
          {formatEuro(bandLow)} – {formatEuro(bandHigh)}
        </div>
      </div>

      {indicativeResult.error && (
        <div className="alert alert-info mb-4">{indicativeResult.error}</div>
      )}

      <div className="shv-band card-tight">
        <div className="shv-band-header">
          <span className="shv-band-title">Aandeelhouderswaarde</span>
          <span className="shv-band-method-badge">Sector-multiple</span>
        </div>
        <div className="shv-band-mid">{formatEuro(shareholderValue)}</div>
        <div className="shv-band-footer">
          <span className="text-sm text-muted">
            {formatEuro(ashLow)} – {formatEuro(ashHigh)}
          </span>
        </div>
      </div>

      <p className="text-sm text-muted mt-3">
        Sector: {indicativeResult.sectorLabel ?? '—'} · Multiple:{' '}
        {indicativeResult.sectorMultipleAdjusted?.toFixed(2) ?? '—'} · EBITDA
        gebruikt:{' '}
        {indicativeResult.ebitdaUsed !== null
          ? formatEuro(indicativeResult.ebitdaUsed)
          : '—'}
      </p>
    </>
  )
}
