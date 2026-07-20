'use client'

import { type ChangeEvent, type FC } from 'react'

import { cn } from '@shared/utils/cn'

import {
  NON_LEGAL_ENTITY_HOUR_TICKS,
  NON_LEGAL_ENTITY_HOURS_DEFAULT,
  NON_LEGAL_ENTITY_HOURS_MAX,
  NON_LEGAL_ENTITY_HOURS_MIN,
  NON_LEGAL_ENTITY_PARTNER_MAX,
  NON_LEGAL_ENTITY_PARTNER_MIN,
  POSITION_PCT_SCALE,
} from './constants'
import { type Props } from './types'

const clampPartnerCount = (raw: number): number =>
  Math.min(
    NON_LEGAL_ENTITY_PARTNER_MAX,
    Math.max(
      NON_LEGAL_ENTITY_PARTNER_MIN,
      Math.trunc(raw) || NON_LEGAL_ENTITY_PARTNER_MIN,
    ),
  )

const tickPositionPct = (tick: number): number =>
  (tick / NON_LEGAL_ENTITY_HOURS_MAX) * POSITION_PCT_SCALE

export const NonLegalEntityCard: FC<Props> = ({ onChange, value }) => {
  const onHasFixedIncomeChange = (hasFixedIncome: boolean): void => {
    onChange({ hasFixedIncome })
  }

  const onHoursChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onChange({ hoursPerWeek: Number(event.target.value) })
  }

  const onPartnerCountChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onChange({ partnerCount: clampPartnerCount(Number(event.target.value)) })
  }

  return (
    <div className="card" style={{ marginTop: '24px' }}>
      <div className="form-section" style={{ marginBottom: 0 }}>
        <h3 className="form-section-title">
          Waardering van niet-rechtspersonen
        </h3>
        <p className="form-section-desc">
          Voor eenmanszaken, VOF&apos;s en andere niet-rechtspersonen waar het
          ondernemers-inkomen niet als bedrijfskost in de boekhouding zit.
        </p>

        <div style={{ marginTop: '18px' }}>
          <label
            style={{
              color: 'var(--ink)',
              display: 'block',
              fontSize: '13.5px',
              fontWeight: 500,
              marginBottom: '10px',
            }}
          >
            Ik heb een vast inkomen, wat in de bedrijfskosten van mijn bedrijf
            zit
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <label
              className={cn(
                'radio-pill',
                value.hasFixedIncome && 'is-selected',
              )}
            >
              <input
                checked={value.hasFixedIncome}
                onChange={() => onHasFixedIncomeChange(true)}
                type="radio"
              />
              <span>Ja</span>
            </label>
            <label
              className={cn(
                'radio-pill',
                !value.hasFixedIncome && 'is-selected',
              )}
            >
              <input
                checked={!value.hasFixedIncome}
                onChange={() => onHasFixedIncomeChange(false)}
                type="radio"
              />
              <span>Nee</span>
            </label>
          </div>
        </div>

        {!value.hasFixedIncome && (
          <div style={{ marginTop: '24px' }}>
            <div style={{ marginBottom: '18px', maxWidth: 480 }}>
              <label
                style={{
                  color: 'var(--ink)',
                  display: 'block',
                  fontSize: '13.5px',
                  fontWeight: 500,
                  marginBottom: '8px',
                }}
              >
                Aantal vennoten waarvan het vaste inkomen niet in de
                bedrijfskosten zit
              </label>
              <input
                max={NON_LEGAL_ENTITY_PARTNER_MAX}
                min={NON_LEGAL_ENTITY_PARTNER_MIN}
                onChange={onPartnerCountChange}
                step={1}
                style={{
                  fontSize: '14px',
                  padding: '8px 12px',
                  width: '120px',
                }}
                type="number"
                value={value.partnerCount ?? 1}
              />
              <span
                className="text-xs text-muted"
                style={{ marginLeft: '10px' }}
              >
                De berekening hieronder wordt vermenigvuldigd met dit aantal.
              </span>
            </div>

            <label
              style={{
                color: 'var(--ink)',
                display: 'block',
                fontSize: '13.5px',
                fontWeight: 500,
                marginBottom: '14px',
              }}
            >
              Hoeveel uur per week werk je in het bedrijf?
            </label>

            <div
              className="vd-slider-block"
              style={{ marginTop: '6px', maxWidth: 'none' }}
            >
              <div className="vd-slider-labels">
                {NON_LEGAL_ENTITY_HOUR_TICKS.map((tick, index) => (
                  <span
                    className={cn(
                      'vd-slider-label',
                      index === 0 && 'is-first',
                      index === NON_LEGAL_ENTITY_HOUR_TICKS.length - 1 &&
                        'is-last',
                    )}
                    key={tick}
                    style={{ left: `${tickPositionPct(tick)}%` }}
                  >
                    {tick}u
                  </span>
                ))}
              </div>
              <input
                className="vd-slider"
                max={NON_LEGAL_ENTITY_HOURS_MAX}
                min={NON_LEGAL_ENTITY_HOURS_MIN}
                onChange={onHoursChange}
                step={1}
                type="range"
                value={value.hoursPerWeek ?? NON_LEGAL_ENTITY_HOURS_DEFAULT}
              />
              <div className="vd-slider-ticks">
                {NON_LEGAL_ENTITY_HOUR_TICKS.map(tick => (
                  <span
                    className="vd-slider-tick"
                    key={tick}
                    style={{ left: `${tickPositionPct(tick)}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
