'use client'

import { type ChangeEvent, type FC } from 'react'

import {
  VD_PERCENTAGE_SLIDER_DEFAULT,
  VD_PERCENTAGE_SLIDER_MAX,
  VD_PERCENTAGE_SLIDER_MIN,
  VD_PERCENTAGE_SLIDER_STEP,
} from '@features/valuation/constants/valueDrivers'
import { cn } from '@shared/utils/cn'

import {
  PERCENTAGE_SNAP_STEP,
  PERCENTAGE_TICK_VALUES,
  POSITION_PCT_SCALE,
  SINGLE_OPTION_POSITION_PCT,
} from './constants'
import { type Props } from './types'

const positionPct = (index: number, total: number): number =>
  total <= 1
    ? SINGLE_OPTION_POSITION_PCT
    : (index / (total - 1)) * POSITION_PCT_SCALE

interface TrackSliderProps {
  labels: readonly string[]
  max: number
  min: number
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  positions: readonly number[]
  step: number
  value: number
}

const TrackSlider: FC<TrackSliderProps> = ({
  labels,
  max,
  min,
  onChange,
  positions,
  step,
  value,
}) => (
  <div className="vd-slider-block">
    <div className="vd-slider-labels">
      {labels.map((label, index) => (
        <span
          className={cn(
            'vd-slider-label',
            index === 0 && 'is-first',
            index === labels.length - 1 && 'is-last',
          )}
          key={label}
          style={{ left: `${positions[index]}%` }}
        >
          {label}
        </span>
      ))}
    </div>
    <input
      className="vd-slider"
      max={max}
      min={min}
      onChange={onChange}
      step={step}
      type="range"
      value={value}
    />
    <div className="vd-slider-ticks">
      {positions.map(position => (
        <span
          className="vd-slider-tick"
          key={position}
          style={{ left: `${position}%` }}
        />
      ))}
    </div>
  </div>
)

export const ValueDriverSlider: FC<Props> = ({
  definition,
  onChange,
  value,
}) => {
  const onRangeChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onChange(Number(event.target.value))
  }

  return (
    <div className="vd-question">
      <div className="vd-question-title">
        {definition.question}
        {definition.tooltip && (
          <span className="info-tip" data-tip={definition.tooltip} tabIndex={0}>
            i
          </span>
        )}
      </div>

      {definition.type === 'percentage_slider' ? (
        <TrackSlider
          labels={PERCENTAGE_TICK_VALUES.map(tick => `${tick}%`)}
          max={VD_PERCENTAGE_SLIDER_MAX}
          min={VD_PERCENTAGE_SLIDER_MIN}
          onChange={onRangeChange}
          positions={PERCENTAGE_TICK_VALUES}
          step={VD_PERCENTAGE_SLIDER_STEP}
          value={
            Math.round(
              (value ?? VD_PERCENTAGE_SLIDER_DEFAULT) / PERCENTAGE_SNAP_STEP,
            ) * PERCENTAGE_SNAP_STEP
          }
        />
      ) : (
        (() => {
          const labels = definition.labels ?? []
          const currentIndex = value ?? Math.floor(labels.length / 2)
          return (
            <TrackSlider
              labels={labels}
              max={Math.max(0, labels.length - 1)}
              min={0}
              onChange={onRangeChange}
              positions={labels.map((_, index) =>
                positionPct(index, labels.length),
              )}
              step={1}
              value={currentIndex}
            />
          )
        })()
      )}
    </div>
  )
}
