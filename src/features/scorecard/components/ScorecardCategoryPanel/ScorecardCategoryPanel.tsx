import { type FC } from 'react'

import { PERCENT_MULTIPLIER, SCORE_MAX_LABEL } from '../../constants/workspace'
import { ScorecardQuestionRow } from '../ScorecardQuestionRow'
import { type Props } from './types'

export const ScorecardCategoryPanel: FC<Props> = ({
  activeStats,
  category,
  onAnswer,
  startIndex,
  state,
}) => {
  const progressPct =
    activeStats.total > 0
      ? Math.round((activeStats.answered / activeStats.total) * PERCENT_MULTIPLIER)
      : 0

  return (
    <div className="card mb-5">
      <div
        className="flex-between"
        style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 10 }}
      >
        <div>
          <h3 style={{ margin: 0 }}>{category.label}</h3>
          <p className="desc" style={{ marginBottom: 0 }}>
            {activeStats.answered} van {activeStats.total} vragen beantwoord
            {activeStats.avg !== null
              ? ` · gemiddeld ${activeStats.avg.toFixed(2).replace('.', ',')} / ${SCORE_MAX_LABEL}`
              : ''}
            .
          </p>
        </div>
      </div>
      <div
        style={{
          background: 'var(--line-soft)',
          borderRadius: 99,
          height: 6,
          margin: '6px 0 18px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: 'var(--green)',
            height: '100%',
            transition: 'width .3s',
            width: `${progressPct}%`,
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {category.items.map((item, index) => (
          <ScorecardQuestionRow
            answer={state[item.id]?.answer}
            item={item}
            key={item.id}
            number={startIndex + index + 1}
            onAnswer={answer => onAnswer(item.id, answer)}
          />
        ))}
      </div>
    </div>
  )
}
