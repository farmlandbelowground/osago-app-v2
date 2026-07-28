'use client'

import { useState, type FC } from 'react'

import { saveValueDrivers } from '@features/valuation/actions'
import {
  VALUE_DRIVERS,
  VD_SECTIONS,
  type ValueDriverDefinition,
} from '@features/valuation/constants/valueDrivers'
import { resolveValueDriverDisplayValue } from '@features/valuation/lib/resolveValueDriverDisplayValue'
import { type ValueDriverAnswers } from '@features/valuation/types'

import { ValueDriverSlider } from '../ValueDriverSlider'
import { type Props } from './types'

type SaveStatus = 'idle' | 'pending' | 'success' | 'error'

const findDefinition = (id: `q${number}`): ValueDriverDefinition => {
  const definition = VALUE_DRIVERS.find(driver => driver.id === id)
  if (!definition) {
    throw new Error(`Unknown value driver id: ${id}`)
  }
  return definition
}

export const ValueDriversForm: FC<Props> = ({ initialAnswers }) => {
  const [answers, setAnswers] = useState<ValueDriverAnswers>(initialAnswers)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onAnswerChange = (id: `q${number}`, value: number): void => {
    setAnswers(previous => ({ ...previous, [id]: value }))
  }

  const onSubmit = async (): Promise<void> => {
    setStatus('pending')
    setErrorMessage(null)

    // Persist every question, using the value each slider is displaying for the
    // ones never dragged — legacy reads the DOM on save, so untouched sliders
    // are stored too. Without this, an untouched question has no key and
    // valueDriversComplete stays false however many sliders were moved.
    const completeAnswers: ValueDriverAnswers = Object.fromEntries(
      VALUE_DRIVERS.map(definition => [
        definition.id,
        resolveValueDriverDisplayValue(definition, answers[definition.id]),
      ]),
    )

    const result = await saveValueDrivers(completeAnswers)

    if (result.error !== null) {
      setStatus('error')
      setErrorMessage(result.error)
      return
    }

    setAnswers(completeAnswers)
    setStatus('success')
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Value drivers</h1>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-primary"
            disabled={status === 'pending'}
            onClick={() => void onSubmit()}
            type="button"
          >
            Opslaan
          </button>
        </div>
      </div>

      <div className="card">
        <p
          className="text-sm text-muted"
          style={{ margin: '0 0 24px 0', maxWidth: 760 }}
        >
          Een waardedrijver is een factor die de waarde van het bedrijf
          aanzienlijk bepaalt of beïnvloedt. Beantwoord de onderstaande 27
          vragen om aan te geven in hoeverre elke waardedrijver op jouw bedrijf
          van toepassing is.
        </p>

        {VD_SECTIONS.map(section => (
          <div className="vd-section" key={section.title}>
            <h3 className="vd-section-title">{section.title}</h3>
            {section.ids.map(id => (
              <ValueDriverSlider
                definition={findDefinition(id)}
                key={id}
                onChange={value => onAnswerChange(id, value)}
                value={answers[id]}
              />
            ))}
          </div>
        ))}

        {status === 'success' && (
          <div className="alert alert-success mt-4">
            Value drivers opgeslagen.
          </div>
        )}
        {status === 'error' && errorMessage && (
          <div className="alert alert-error mt-4">{errorMessage}</div>
        )}

        <div
          style={{
            borderTop: '1px solid var(--line-soft)',
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
            marginTop: '24px',
            paddingTop: '18px',
          }}
        >
          <button
            className="btn btn-primary"
            disabled={status === 'pending'}
            onClick={() => void onSubmit()}
            type="button"
          >
            {status === 'pending' ? 'Bezig...' : 'Value drivers opslaan'}
          </button>
        </div>
      </div>
    </>
  )
}
