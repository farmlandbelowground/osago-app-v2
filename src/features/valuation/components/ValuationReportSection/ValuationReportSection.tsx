'use client'

import { useState, type CSSProperties, type FC } from 'react'

import {
  composeReportText,
  saveValuationReportField,
} from '@features/valuation/actions'
import { AiPillGroup } from '@shared/ai-compose'
import { useToastStore } from '@shared/store/toast'

import { type Props } from './types'

const textareaStyle: CSSProperties = {
  background: '#fff',
  border: '1px solid var(--line)',
  borderRadius: 6,
  color: 'var(--ink)',
  fontFamily: 'inherit',
  fontSize: 14,
  lineHeight: 1.6,
  minHeight: 208,
  padding: '14px 16px',
  resize: 'vertical',
  width: '100%',
}

export const ValuationReportSection: FC<Props> = ({
  initialValue,
  isFirst,
  section,
}) => {
  const showToast = useToastStore(state => state.showToast)
  const [value, setValue] = useState(initialValue)
  const [isPending, setIsPending] = useState(false)

  const onSave = async (): Promise<void> => {
    setIsPending(true)
    const result = await saveValuationReportField(section.field, value)
    setIsPending(false)

    if (result.error !== null) {
      showToast(result.error, 'error')
      return
    }

    showToast('Opgeslagen.')
  }

  return (
    <div className="card" style={isFirst ? undefined : { marginTop: 24 }}>
      <div className="form-section">
        {/* "Optioneel" badge removed (#65, spec §13.1): a filled field appears
            in the report, an empty one is omitted, so the badge is redundant. */}
        <h3 className="form-section-title">{section.title}</h3>
        <p className="form-section-desc">{section.description}</p>

        <div className="field" style={{ marginBottom: 0, marginTop: 14 }}>
          <AiPillGroup
            currentValue={value}
            onCompose={request =>
              composeReportText({
                action: request.action,
                currentValue: request.currentValue,
                field: section.field,
                instruction: request.instruction,
                length: request.length,
              })
            }
            onResult={setValue}
          />
          <textarea
            onChange={event => setValue(event.target.value)}
            placeholder={section.placeholder}
            rows={8}
            style={textareaStyle}
            value={value}
          />
        </div>

        <div
          style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}
        >
          <button
            className="btn btn-primary"
            disabled={isPending}
            onClick={() => void onSave()}
            type="button"
          >
            {isPending ? 'Bezig...' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  )
}
