'use client'

import { useState, type FC } from 'react'

import { useToastStore } from '@shared/store/toast'

import {
  composePresentationText,
  savePresentationField,
  savePresentationTab,
} from '../../actions'
import { PhotoSection } from '../PhotoSection'
import { PresentationField } from '../PresentationField'
import { type Props } from './types'

// Ports renderPresExtPanel (osago-bundle.js:19100-19130): a 2-column field grid,
// the shared photo section, and a per-tab "Opslaan" that flushes every field.
// Fields also save on blur, and an AI result auto-persists (pres-ext behavior,
// spec §3.8). Owns the live values so the save-all can flush unblurred input.
export const PresentationFieldPanel: FC<Props> = ({
  initialValues,
  photos,
  tab,
}) => {
  const showToast = useToastStore(state => state.showToast)
  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const [isSaving, setIsSaving] = useState(false)

  const setFieldValue = (key: string, value: string): void =>
    setValues(previous => ({ ...previous, [key]: value }))

  const onSaveAll = async (): Promise<void> => {
    setIsSaving(true)
    const result = await savePresentationTab(values)
    setIsSaving(false)
    if (result.error !== null) {
      showToast(result.error, 'error')
      return
    }
    showToast('Wijzigingen opgeslagen.')
  }

  return (
    <div className="card mb-5">
      <div className="form-section" style={{ marginBottom: 0 }}>
        <h3 className="form-section-title">{tab.sectionTitle}</h3>
        <div
          style={{
            display: 'grid',
            gap: '0 16px',
            gridTemplateColumns: '1fr 1fr',
            marginTop: 6,
          }}
        >
          {tab.fields.map(field => (
            <PresentationField
              field={field}
              key={field.key}
              onAiResult={text => {
                setFieldValue(field.key, text)
                void savePresentationField(field.key, text)
              }}
              onBlur={() => {
                void savePresentationField(field.key, values[field.key] ?? '')
              }}
              onChange={value => setFieldValue(field.key, value)}
              onCompose={request =>
                composePresentationText({
                  action: request.action,
                  currentValue: request.currentValue,
                  field: field.key,
                  instruction: request.instruction,
                  length: request.length,
                })
              }
              value={values[field.key] ?? ''}
            />
          ))}
        </div>

        <PhotoSection initialPhotos={photos} tabId={tab.id} />

        <div
          style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}
        >
          <button
            className="btn btn-primary"
            disabled={isSaving}
            onClick={() => void onSaveAll()}
            type="button"
          >
            {isSaving ? 'Bezig...' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  )
}
