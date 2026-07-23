'use client'

import { type FC } from 'react'

import { AiPillGroup } from '@shared/ai-compose'

import { type Props } from './types'

// Ports one field of renderPresExtPanel (osago-bundle.js:19111-19123): label +
// optional tooltip + AI pills + textarea. The "Optioneel" badge was removed (#65,
// spec §13.1): a filled field appears in the document, an empty one is omitted,
// so the badge is redundant. The parent panel owns the live value + persistence.
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
