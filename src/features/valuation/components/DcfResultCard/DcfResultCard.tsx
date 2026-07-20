import { type FC } from 'react'

import { PERCENT_DECIMALS, PERCENT_MULTIPLIER } from './constants'
import { type Props } from './types'

const formatEuro = (value: number): string =>
  `€ ${Math.round(value).toLocaleString('nl-NL')}`
const formatPercentage = (value: number): string =>
  `${(value * PERCENT_MULTIPLIER).toFixed(PERCENT_DECIMALS)}%`

export const DcfResultCard: FC<Props> = ({
  ashHigh,
  ashLow,
  bandHigh,
  bandLow,
  dcfResult,
  enterpriseValue,
  shareholderValue,
}) => {
  const { totalen } = dcfResult.berekening

  return (
    <>
      <div className="valuation-result">
        <div className="label">Indicatieve ondernemingswaarde</div>
        <div className="value">{formatEuro(enterpriseValue)}</div>
        <div className="range">
          {formatEuro(bandLow)} – {formatEuro(bandHigh)}
        </div>
      </div>

      <div className="shv-band card-tight">
        <div className="shv-band-header">
          <span className="shv-band-title">Aandeelhouderswaarde</span>
          <span className="shv-band-method-badge">DCF</span>
        </div>
        <div className="shv-band-mid">{formatEuro(shareholderValue)}</div>
        <div className="shv-band-footer">
          <span className="text-sm text-muted">
            {formatEuro(ashLow)} – {formatEuro(ashHigh)}
          </span>
        </div>
      </div>

      <div className="dcf-panel open">
        <div className="dcf-panel-header">
          <h3>DCF-methodiek</h3>
        </div>
        <table className="dcfn-wacc-table">
          <tbody>
            <tr>
              <td>Kostenvoet (WACC)</td>
              <td>{formatPercentage(dcfResult.kostenvoet)}</td>
            </tr>
            <tr>
              <td>Waarde scenarioperiode</td>
              <td>{formatEuro(totalen.waardeScenario)}</td>
            </tr>
            <tr>
              <td>Restwaarde</td>
              <td>{formatEuro(totalen.waardeRest)}</td>
            </tr>
            <tr>
              <td>Totaal</td>
              <td>{formatEuro(totalen.totaal)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}
