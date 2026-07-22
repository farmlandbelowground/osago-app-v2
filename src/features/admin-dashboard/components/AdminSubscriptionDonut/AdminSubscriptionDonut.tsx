import { type FC } from 'react'

import {
  DONUT_CENTER,
  DONUT_LABEL_TEXT_Y,
  DONUT_RADIUS,
  DONUT_STROKE_WIDTH,
  DONUT_TOTAL_TEXT_Y,
  DONUT_TRACK_COLOR,
  DONUT_VERKOOP_COLOR,
  DONUT_VIEWBOX,
  DONUT_WAARDE_COLOR,
  PERCENT_MULTIPLIER,
} from '../../constants'
import { type Props } from './types'

// Ports donutHTML (osago-bundle.js:24954): a two-arc SVG donut of the lopende
// verkoop-vs-waardering split, drawn with stroke-dasharray + dashoffset.
export const AdminSubscriptionDonut: FC<Props> = ({
  verkoopCount,
  waardeCount,
}) => {
  const total = verkoopCount + waardeCount

  if (total === 0) {
    return (
      <div
        className="text-muted text-sm"
        style={{ padding: '24px 0', textAlign: 'center' }}
      >
        Geen lopende abonnementen in deze periode.
      </div>
    )
  }

  const circumference = 2 * Math.PI * DONUT_RADIUS
  const verkoopFrac = verkoopCount / total
  const waardeFrac = waardeCount / total
  const verkoopLen = circumference * verkoopFrac
  const waardeLen = circumference * waardeFrac

  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 24,
        justifyContent: 'center',
      }}
    >
      <svg
        height={DONUT_VIEWBOX}
        style={{ flexShrink: 0 }}
        viewBox={`0 0 ${DONUT_VIEWBOX} ${DONUT_VIEWBOX}`}
        width={DONUT_VIEWBOX}
      >
        <g transform={`translate(${DONUT_CENTER},${DONUT_CENTER}) rotate(-90)`}>
          <circle
            fill="none"
            r={DONUT_RADIUS}
            stroke={DONUT_TRACK_COLOR}
            strokeWidth={DONUT_STROKE_WIDTH}
          />
          <circle
            fill="none"
            r={DONUT_RADIUS}
            stroke={DONUT_VERKOOP_COLOR}
            strokeDasharray={`${verkoopLen} ${circumference - verkoopLen}`}
            strokeDashoffset={0}
            strokeWidth={DONUT_STROKE_WIDTH}
          />
          <circle
            fill="none"
            r={DONUT_RADIUS}
            stroke={DONUT_WAARDE_COLOR}
            strokeDasharray={`${waardeLen} ${circumference - waardeLen}`}
            strokeDashoffset={-verkoopLen}
            strokeWidth={DONUT_STROKE_WIDTH}
          />
        </g>
        <text
          fill="var(--ink)"
          fontSize="20"
          fontWeight="600"
          textAnchor="middle"
          x={DONUT_CENTER}
          y={DONUT_TOTAL_TEXT_Y}
        >
          {total}
        </text>
        <text
          fill="var(--muted)"
          fontSize="10"
          textAnchor="middle"
          x={DONUT_CENTER}
          y={DONUT_LABEL_TEXT_Y}
        >
          totaal
        </text>
      </svg>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          fontSize: 13,
          gap: 10,
          minWidth: 140,
        }}
      >
        <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
          <span
            style={{
              background: DONUT_VERKOOP_COLOR,
              borderRadius: 3,
              display: 'inline-block',
              height: 12,
              width: 12,
            }}
          />
          <span className="fw-600">Verkoop</span>
          <span className="text-muted" style={{ marginLeft: 'auto' }}>
            {verkoopCount} ({Math.round(verkoopFrac * PERCENT_MULTIPLIER)}%)
          </span>
        </div>
        <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
          <span
            style={{
              background: DONUT_WAARDE_COLOR,
              borderRadius: 3,
              display: 'inline-block',
              height: 12,
              width: 12,
            }}
          />
          <span className="fw-600">Waardering</span>
          <span className="text-muted" style={{ marginLeft: 'auto' }}>
            {waardeCount} ({Math.round(waardeFrac * PERCENT_MULTIPLIER)}%)
          </span>
        </div>
      </div>
    </div>
  )
}
