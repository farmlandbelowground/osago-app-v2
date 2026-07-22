import { type FC } from 'react'

import {
  PERCENT_MULTIPLIER,
  RATING_WEIGHTS_META,
  SCORE_MAX_LABEL,
} from '../../constants/workspace'
import { type Props } from './types'

export const ScorecardKpiRow: FC<Props> = ({ stats }) => {
  const scanPct =
    stats.totalQuestions > 0
      ? Math.round(
          (stats.totalAnswered / stats.totalQuestions) * PERCENT_MULTIPLIER,
        )
      : 0

  return (
    <div className="grid-3 mb-4 grid">
      <div className="stat-card">
        <div className="stat-label">Beantwoorde vragen</div>
        <div className="stat-value">
          {stats.totalAnswered} / {stats.totalQuestions}
        </div>
        <div className="stat-meta">{scanPct}% van de scan ingevuld</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Gemiddelde score</div>
        <div className="stat-value">
          {stats.overallAvg !== null
            ? stats.overallAvg.toFixed(2).replace('.', ',')
            : '—'}
          <span className="text-sm text-muted" style={{ fontWeight: 400 }}>
            {' '}
            / {SCORE_MAX_LABEL}
          </span>
        </div>
        <div className="stat-meta">{stats.overallLabel}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Verkoopklaar-rating</div>
        <div className="stat-value">{stats.overallPct}%</div>
        <div className="stat-meta">
          {stats.ratedCount} beoordeelde vragen · {RATING_WEIGHTS_META}
        </div>
      </div>
    </div>
  )
}
