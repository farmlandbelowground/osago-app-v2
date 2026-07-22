'use client'

import { useRouter } from 'next/navigation'
import { useState, type FC } from 'react'

import { useToastStore } from '@shared/store/toast'

import { saveValuationMultiples } from '../../../actions'
import {
  DCF_SECTORCORRECTIE_BASE_MULTIPLE,
  DCF_SECTORCORRECTIE_STEP,
} from '../../../constants/dcf'
import {
  MULTIPLE_MAX,
  MULTIPLE_MIN,
  MULTIPLE_STEP,
  PERCENT_DECIMALS,
  PERCENT_DIVISOR,
} from '../../../constants/valuationAdmin'
import { computeSectorcorrectieFromMultiple } from '../../../lib/dcfCompute'
import { type Props } from './types'

const formatSectorcorrectie = (multipleValue: string): string => {
  const value = parseFloat(multipleValue.replace(',', '.'))

  if (!Number.isFinite(value)) {
    return '—'
  }

  return `${(computeSectorcorrectieFromMultiple(value) * PERCENT_DIVISOR)
    .toFixed(PERCENT_DECIMALS)
    .replace('.', ',')} %`
}

export const ValuationMultiplesCard: FC<Props> = ({ multiples }) => {
  const router = useRouter()
  const showToast = useToastStore(state => state.showToast)
  const [rows, setRows] = useState(
    multiples.map(multiple => ({
      id: multiple.id,
      label: multiple.label,
      value: String(multiple.value),
    })),
  )
  const [isPending, setIsPending] = useState(false)

  const baseText = String(DCF_SECTORCORRECTIE_BASE_MULTIPLE).replace('.', ',')
  const stepText = (DCF_SECTORCORRECTIE_STEP * PERCENT_DIVISOR)
    .toFixed(1)
    .replace('.', ',')

  const updateValue = (id: string, value: string): void => {
    setRows(current =>
      current.map(row => (row.id === id ? { ...row, value } : row)),
    )
  }

  const onSave = async (): Promise<void> => {
    const parsed = rows.map(row => ({
      id: row.id,
      label: row.label,
      value: parseFloat(row.value.replace(',', '.')),
    }))

    if (
      parsed.some(
        row =>
          !Number.isFinite(row.value) ||
          row.value < MULTIPLE_MIN ||
          row.value > MULTIPLE_MAX,
      )
    ) {
      showToast('Vul geldige multiples in (0 tot 99,9).', 'error')
      return
    }

    setIsPending(true)
    const result = await saveValuationMultiples(parsed)
    setIsPending(false)

    if (result.error) {
      showToast(result.error, 'error')
      return
    }

    showToast('Multiples bijgewerkt.')
    router.refresh()
  }

  return (
    <div className="card">
      <div
        style={{
          alignItems: 'flex-start',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 24,
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div>
          <h2 className="form-section-title" style={{ margin: 0 }}>
            Multiples
          </h2>
          <p
            className="form-section-desc"
            style={{ margin: '6px 0 0', maxWidth: 640 }}
          >
            EBITDA-multiples per sector, gebruikt bij de waardebepaling. Pas een
            waarde aan en klik op <strong>Wijzigingen opslaan</strong>. De{' '}
            <strong>Sectorcorrectie</strong> wordt automatisch afgeleid van de
            multiple: bij {baseText}x is de correctie 0&nbsp;%; elk multiple-punt
            eronder geeft +{stepText}&nbsp;%, elk multiple-punt erboven −
            {stepText}&nbsp;%.
          </p>
        </div>
        <button
          className="btn btn-primary"
          disabled={isPending}
          onClick={() => void onSave()}
          type="button"
        >
          Wijzigingen opslaan
        </button>
      </div>

      <table style={{ width: '100%' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Sector</th>
            <th style={{ textAlign: 'right', width: 200 }}>EBITDA-multiple</th>
            <th style={{ textAlign: 'right', width: 200 }}>Sectorcorrectie</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id}>
              <td>{row.label}</td>
              <td style={{ textAlign: 'right' }}>
                <div
                  style={{
                    alignItems: 'center',
                    display: 'inline-flex',
                    gap: 6,
                  }}
                >
                  <input
                    max={MULTIPLE_MAX}
                    min={MULTIPLE_MIN}
                    onChange={event => updateValue(row.id, event.target.value)}
                    step={MULTIPLE_STEP}
                    style={{
                      border: '1px solid var(--line)',
                      borderRadius: 6,
                      padding: '6px 10px',
                      textAlign: 'right',
                      width: 90,
                    }}
                    type="number"
                    value={row.value}
                  />
                  <span style={{ color: 'var(--muted)', fontWeight: 500 }}>
                    x
                  </span>
                </div>
              </td>
              <td style={{ textAlign: 'right' }}>
                <span
                  style={{
                    background: 'var(--line-soft)',
                    border: '1px solid var(--line)',
                    borderRadius: 6,
                    color: 'var(--muted)',
                    display: 'inline-block',
                    fontVariantNumeric: 'tabular-nums',
                    minWidth: 90,
                    padding: '6px 10px',
                    textAlign: 'right',
                  }}
                  title="Afgeleid van de EBITDA-multiple — niet handmatig te wijzigen"
                >
                  {formatSectorcorrectie(row.value)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
