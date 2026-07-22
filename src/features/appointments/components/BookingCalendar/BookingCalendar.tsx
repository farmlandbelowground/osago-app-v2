'use client'

import { type FC } from 'react'

import {
  CALENDAR_WEEKDAY_HEADERS,
  DAY_CELL_FONT_WEIGHT_ACTIVE,
  DAY_CELL_FONT_WEIGHT_DEFAULT,
  DAY_CELL_PAST_OPACITY,
} from '../../constants'
import { buildMonthGrid } from '../../lib/calendar'
import { type Props } from './types'

export const BookingCalendar: FC<Props> = ({
  color,
  horizonEnd,
  monthCursor,
  onMonthCursorChange,
  onSelectDay,
  selectedDay,
  slotsByDay,
  today,
}) => {
  const grid = buildMonthGrid(monthCursor)
  const isPrevDisabled = monthCursor <= today
  const isNextDisabled = grid.nextCursor > horizonEnd

  return (
    <div style={{ borderRight: '1px solid var(--line)', padding: '24px 28px' }}>
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <button
          className="btn btn-ghost btn-sm"
          disabled={isPrevDisabled}
          onClick={() =>
            onMonthCursorChange(
              grid.prevCursor < today ? today : grid.prevCursor,
            )
          }
          type="button"
        >
          ‹
        </button>
        <strong style={{ textTransform: 'capitalize' }}>
          {grid.monthLabel}
        </strong>
        <button
          className="btn btn-ghost btn-sm"
          disabled={isNextDisabled}
          onClick={() => onMonthCursorChange(grid.nextCursor)}
          type="button"
        >
          ›
        </button>
      </div>

      <div
        style={{
          color: 'var(--muted)',
          display: 'grid',
          fontSize: 11,
          fontWeight: 600,
          gap: 4,
          gridTemplateColumns: 'repeat(7, 1fr)',
          marginBottom: 6,
          textAlign: 'center',
          textTransform: 'uppercase',
        }}
      >
        {CALENDAR_WEEKDAY_HEADERS.map(weekday => (
          <div key={weekday}>{weekday}</div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gap: 4,
          gridTemplateColumns: 'repeat(7, 1fr)',
        }}
      >
        {Array.from({ length: grid.startWeekday }, (_, index) => (
          <div key={`empty-${index}`} />
        ))}
        {grid.days.map(({ dayKey, dayNumber }) => {
          const hasSlots = (slotsByDay[dayKey] ?? []).length > 0
          const isPast = dayKey < today
          const isToday = dayKey === today
          const isSelected = dayKey === selectedDay
          const isOutOfRange = dayKey > horizonEnd
          const isDisabled = isPast || isOutOfRange || !hasSlots

          return (
            <button
              disabled={isDisabled}
              key={dayKey}
              onClick={isDisabled ? undefined : () => onSelectDay(dayKey)}
              style={{
                aspectRatio: '1',
                background: isSelected
                  ? color
                  : hasSlots
                    ? 'var(--green-soft)'
                    : 'transparent',
                border:
                  isToday && !isSelected
                    ? '1.5px solid var(--green)'
                    : '1px solid transparent',
                borderRadius: 8,
                color: isSelected
                  ? '#fff'
                  : isDisabled
                    ? 'var(--muted)'
                    : 'var(--ink)',
                cursor: isDisabled ? 'default' : 'pointer',
                fontSize: 13,
                fontWeight:
                  isSelected || isToday
                    ? DAY_CELL_FONT_WEIGHT_ACTIVE
                    : DAY_CELL_FONT_WEIGHT_DEFAULT,
                opacity: isPast || isOutOfRange ? DAY_CELL_PAST_OPACITY : 1,
              }}
              type="button"
            >
              {dayNumber}
            </button>
          )
        })}
      </div>
    </div>
  )
}
