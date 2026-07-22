'use client'

import { type FC } from 'react'

import { cn } from '@shared/utils/cn'

import {
  SCORECARD_SLIDER_ORDER,
  SCORECARD_UNANSWERED_SLIDER_INDEX,
} from '../../constants/answerOptions'
import {
  SLIDER_LABELS,
  SLIDER_MAX,
  SLIDER_MIN,
  SLIDER_POSITIONS,
} from '../../constants/workspace'
import { type Props } from './types'

export const ScorecardQuestionRow: FC<Props> = ({
  answer,
  item,
  number,
  onAnswer,
}) => {
  const isNvt = answer === 'nvt'
  const orderIndex = answer
    ? SCORECARD_SLIDER_ORDER.indexOf(answer as (typeof SCORECARD_SLIDER_ORDER)[number])
    : -1
  const sliderIndex = orderIndex >= 0 ? orderIndex : SCORECARD_UNANSWERED_SLIDER_INDEX

  const onSlide = (value: string): void => {
    const index = Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, parseInt(value, 10) || 0))
    onAnswer(SCORECARD_SLIDER_ORDER[index])
  }

  return (
    <div
      className="vd-question sc-question"
      style={{ borderBottom: '1px solid var(--line-soft)' }}
    >
      <div
        className="vd-question-title"
        style={{ alignItems: 'flex-start', display: 'flex', gap: 8 }}
      >
        <span className="text-muted" style={{ flexShrink: 0, fontWeight: 600 }}>
          {number}.
        </span>
        <span>{item.label}</span>
      </div>
      <div
        className="vd-slider-block"
        style={{
          marginTop: 6,
          maxWidth: 'none',
          ...(isNvt ? { opacity: 0.4, pointerEvents: 'none' } : {}),
        }}
      >
        <div className="vd-slider-labels">
          {SLIDER_LABELS.map((label, index) => (
            <span
              className={cn(
                'vd-slider-label',
                index === 0 && 'is-first',
                index === SLIDER_LABELS.length - 1 && 'is-last',
              )}
              key={label}
              style={{ left: `${SLIDER_POSITIONS[index]}%` }}
            >
              {label}
            </span>
          ))}
        </div>
        <input
          className="vd-slider sc-slider"
          disabled={isNvt}
          max={SLIDER_MAX}
          min={SLIDER_MIN}
          onChange={event => onSlide(event.target.value)}
          step={1}
          type="range"
          value={sliderIndex}
        />
        <div className="vd-slider-ticks">
          {SLIDER_POSITIONS.map(position => (
            <span
              className="vd-slider-tick"
              key={position}
              style={{ left: `${position}%` }}
            />
          ))}
        </div>
      </div>
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          marginTop: 12,
        }}
      >
        <label
          style={{
            alignItems: 'center',
            color: 'var(--muted)',
            cursor: 'pointer',
            display: 'inline-flex',
            fontSize: 12.5,
            gap: 6,
            userSelect: 'none',
          }}
        >
          <input
            checked={isNvt}
            className="sc-nvt"
            onChange={event => onAnswer(event.target.checked ? 'nvt' : null)}
            style={{ accentColor: 'var(--green)', cursor: 'pointer', height: 14, width: 14 }}
            type="checkbox"
          />
          Niet van toepassing
        </label>
      </div>
    </div>
  )
}
