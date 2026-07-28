import { type FC } from 'react'

import { formatDcfEuro } from '../../lib/formatValuationEuro'
import { ValuationRangeCard } from '../ValuationRangeCard'
import {
  TOTALS_LABEL_STYLE,
  TOTALS_ROW_STYLE,
  TOTALS_TABLE_STYLE,
  TOTALS_TOTAL_LABEL_STYLE,
  TOTALS_TOTAL_ROW_STYLE,
  TOTALS_TOTAL_VALUE_STYLE,
  TOTALS_VALUE_STYLE,
} from './constants'
import { type Props } from './types'

// Ports renderDcfNewWaardebepalingBlockV2 (osago-bundle.js:5659-5714). Shown in
// place of the "Indicatieve ondernemingswaarde" slider when dcfApplyEnabled.
// `isLive` is deliberately off: legacy's updateShareholderValueLive never
// touches this card's labels, so they stay put while the customer types in
// Bandbreedte and only refresh on save.
export const DcfResultCard: FC<Props> = ({ band, totalen }) => (
  <ValuationRangeCard
    band={band}
    idSuffix="dcf"
    mid={totalen.totaal}
    title="DCF Waarde"
  >
    <div style={TOTALS_TABLE_STYLE}>
      <div style={TOTALS_ROW_STYLE}>
        <div style={TOTALS_LABEL_STYLE}>Waarde scenarioperiode</div>
        <div style={TOTALS_VALUE_STYLE}>
          {formatDcfEuro(totalen.waardeScenario)}
        </div>
      </div>
      <div style={TOTALS_ROW_STYLE}>
        <div style={TOTALS_LABEL_STYLE}>Waarde restperiode</div>
        <div style={TOTALS_VALUE_STYLE}>
          {formatDcfEuro(totalen.waardeRest)}
        </div>
      </div>
      <div style={TOTALS_TOTAL_ROW_STYLE}>
        <div style={TOTALS_TOTAL_LABEL_STYLE}>Totaal</div>
        <div style={TOTALS_TOTAL_VALUE_STYLE}>
          {formatDcfEuro(totalen.totaal)}
        </div>
      </div>
    </div>
  </ValuationRangeCard>
)
