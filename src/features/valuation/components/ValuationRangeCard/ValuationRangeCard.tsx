'use client'

import { type FC } from 'react'

import { formatValuationEuro } from '../../lib/formatValuationEuro'
import { useValuationBandStore } from '../../store'
import {
  CARD_MARGIN_TOP,
  RANGE_ACTIVE_INSET,
  RANGE_HIGH_LEFT,
  RANGE_LOW_LEFT,
  RANGE_MID_LEFT,
} from './constants'
import { type Props } from './types'

export const ValuationRangeCard: FC<Props> = ({
  band,
  children,
  idSuffix,
  isLive = false,
  mid,
  title,
}) => {
  const liveBand = useValuationBandStore(state => state.band)
  const effectiveBand = isLive && liveBand !== null ? liveBand : band

  return (
    <div
      className="shv-card shv-card--summary"
      id={`val-summary-${idSuffix}`}
      style={{ marginTop: CARD_MARGIN_TOP }}
    >
      <div className="shv-band">
        <div className="shv-band-header">
          <div className="shv-band-title">{title}</div>
        </div>

        <div className="shv-range" id={`shv-range-${idSuffix}`}>
          <div className="shv-range-track" />
          <div
            className="shv-range-active"
            style={{ left: RANGE_ACTIVE_INSET, right: RANGE_ACTIVE_INSET }}
          />
          <div
            className="shv-range-mid-tick"
            style={{ left: RANGE_MID_LEFT }}
          />
          <div className="shv-range-handle" style={{ left: RANGE_LOW_LEFT }} />
          <div className="shv-range-handle" style={{ left: RANGE_HIGH_LEFT }} />
          <div
            className="shv-range-label low"
            id={`shv-range-low-${idSuffix}`}
            style={{ left: RANGE_LOW_LEFT }}
          >
            {formatValuationEuro(mid - effectiveBand)}
          </div>
          <div
            className="shv-range-label high"
            id={`shv-range-high-${idSuffix}`}
            style={{ left: RANGE_HIGH_LEFT }}
          >
            {formatValuationEuro(mid + effectiveBand)}
          </div>
          <div
            className="shv-range-label mid"
            id={`shv-range-midlabel-${idSuffix}`}
            style={{ left: RANGE_MID_LEFT }}
          >
            {formatValuationEuro(mid)}
          </div>
        </div>
      </div>

      {children}
    </div>
  )
}
