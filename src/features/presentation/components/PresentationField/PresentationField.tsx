'use client'

import { type CSSProperties, type FC } from 'react'

import { AiPillGroup } from '@shared/ai-compose'

import { OPTIONAL_BADGE_LABEL } from '../../constants/presentation'
import { type Props } from './types'

// Optional badge — verbatim inline style from renderPresExtPanel's optionalMark
// (osago-bundle.js:19109).
const optionalBadgeStyle: CSSProperties = {
  border: '1px solid var(--green)',
  borderRadius: 3,
  color: 'var(--green-dark)',
  display: 'inline-block',
  fontSize: '10.5px',
  fontWeight: 500,
  letterSpacing: '0.06em',
  marginLeft: 8,
  padding: '1px 7px',
  textTransform: 'uppercase',
  verticalAlign: 'middle',
}

// Ports one field of renderPresExtPanel (osago-bundle.js:19111-19123): label +
// optional tooltip + Optioneel badge (when not required) + AI pills + textarea.
// The parent panel owns the live value and persistence.
export const PresentationField: FC<Props> = ({
  field,
  onAiResult,
  onBlur,
  onChange,
  onCompose,
  value,
}) => (
  <div
    className="field"
    style={{
      gridColumn: field.half ? undefined : '1 / -1',
      marginTop: 14,
    }}
  >
    <label>
      {field.label}
      {field.tooltip && (
        <span
          aria-label={field.tooltip}
          className="info-tip"
          data-tip={field.tooltip}
          tabIndex={0}
        >
          i
        </span>
      )}
      {!field.required && (
        <span style={optionalBadgeStyle}>{OPTIONAL_BADGE_LABEL}</span>
      )}
    </label>
    <AiPillGroup
      currentValue={value}
      onCompose={onCompose}
      onResult={onAiResult}
    />
    <textarea
      onBlur={onBlur}
      onChange={event => onChange(event.target.value)}
      placeholder={field.placeholder}
      rows={field.rows}
      value={value}
    />
  </div>
)
