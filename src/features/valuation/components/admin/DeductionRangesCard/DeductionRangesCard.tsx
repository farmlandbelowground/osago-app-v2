'use client'

import { useRouter } from 'next/navigation'
import { useState, type FC, type ReactNode } from 'react'

import { MoneyInput } from '@shared/components/MoneyInput'
import { useToastStore } from '@shared/store/toast'

import { type Props } from './types'

interface EditableRow {
  deduction: string
  from: number | null
  id: string
  to: number | null
}

const toDeductionText = (value: number): string => String(value).replace('.', ',')

const parseInteger = (value: string): number | null => {
  const trimmed = value.trim()
  if (trimmed === '') {
    return null
  }
  const parsed = parseInt(trimmed, 10)
  return Number.isFinite(parsed) ? parsed : null
}

// Shared editor for both deduction tables (EBITDA in euro / organisatie in FTE).
// Ports rerenderSmallEbitdaList/rerenderSmallOrgList + their save handlers
// (osago-bundle.js:27620-27801); the two are byte-identical apart from field
// names and the € prefix, so a single editor avoids duplication. Inputs use the
// legacy .fin-input-wrap boxes (euro fields via the shared MoneyInput).
export const DeductionRangesCard: FC<Props> = ({
  description,
  fromLabel,
  initialRows,
  isEuro,
  onSave,
  successMessage,
  title,
  toLabel,
}) => {
  const router = useRouter()
  const showToast = useToastStore(state => state.showToast)
  const [rows, setRows] = useState<EditableRow[]>(() =>
    initialRows.map(row => ({
      deduction: toDeductionText(row.deduction),
      from: row.from,
      id: crypto.randomUUID(),
      to: row.to,
    })),
  )
  const [isPending, setIsPending] = useState(false)

  const updateNumber = (
    id: string,
    key: 'from' | 'to',
    value: number | null,
  ): void => {
    setRows(current =>
      current.map(row => (row.id === id ? { ...row, [key]: value } : row)),
    )
  }

  const updateDeduction = (id: string, value: string): void => {
    setRows(current =>
      current.map(row => (row.id === id ? { ...row, deduction: value } : row)),
    )
  }

  const addRow = (): void => {
    setRows(current => [
      ...current,
      { deduction: '0', from: null, id: crypto.randomUUID(), to: null },
    ])
  }

  const removeRow = (id: string): void => {
    setRows(current => current.filter(row => row.id !== id))
  }

  const onSaveClick = async (): Promise<void> => {
    setIsPending(true)
    const result = await onSave(
      rows.map(row => ({
        deduction: Number(row.deduction.replace(',', '.')) || 0,
        from: row.from,
        to: row.to,
      })),
    )
    setIsPending(false)

    if (result.error) {
      showToast(result.error, 'error')
      return
    }

    showToast(successMessage)
    router.refresh()
  }

  const label = (text: string): ReactNode => (
    <label
      className="text-xs text-muted fw-600"
      style={{
        display: 'block',
        letterSpacing: '0.05em',
        marginBottom: 4,
        textTransform: 'uppercase',
      }}
    >
      {text}
    </label>
  )

  const rangeField = (row: EditableRow, key: 'from' | 'to'): ReactNode => {
    if (isEuro) {
      return (
        <MoneyInput
          onChange={value => updateNumber(row.id, key, value)}
          placeholder="0"
          value={row[key]}
        />
      )
    }

    return (
      <div className="fin-input-wrap fin-input-wrap--text">
        <input
          inputMode="numeric"
          onChange={event =>
            updateNumber(row.id, key, parseInteger(event.target.value))
          }
          placeholder="0"
          type="text"
          value={row[key] === null ? '' : String(row[key])}
        />
      </div>
    )
  }

  return (
    <div className="card" style={{ marginTop: 24 }}>
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
            {title}
          </h2>
          <p
            className="form-section-desc"
            style={{ margin: '6px 0 0', maxWidth: 640 }}
          >
            {description}
          </p>
        </div>
        <button
          className="btn btn-primary"
          disabled={isPending}
          onClick={() => void onSaveClick()}
          type="button"
        >
          Wijzigingen opslaan
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.length === 0 && (
          <div
            className="text-sm text-muted"
            style={{
              borderBottom: '1px solid var(--line-soft)',
              borderTop: '1px solid var(--line-soft)',
              padding: '14px 0',
            }}
          >
            Nog geen aftrek-rijen toegevoegd. Klik op &quot;+ Rij toevoegen&quot;
            om te beginnen.
          </div>
        )}
        {rows.map((row, index) => (
          <div
            key={row.id}
            style={{
              alignItems: 'end',
              display: 'grid',
              gap: 10,
              gridTemplateColumns: '1fr 1fr 1fr 36px',
            }}
          >
            <div>
              {index === 0 && label(fromLabel)}
              {rangeField(row, 'from')}
            </div>
            <div>
              {index === 0 && label(toLabel)}
              {rangeField(row, 'to')}
            </div>
            <div>
              {index === 0 && label('Aftrekwaarde')}
              <div className="fin-input-wrap fin-input-wrap--text">
                <input
                  inputMode="decimal"
                  onChange={event =>
                    updateDeduction(row.id, event.target.value)
                  }
                  placeholder="0,00"
                  type="text"
                  value={row.deduction}
                />
              </div>
            </div>
            <button
              aria-label="Verwijderen"
              className="btn btn-ghost"
              onClick={() => removeRow(row.id)}
              style={{
                color: 'var(--muted)',
                fontSize: 18,
                height: 34,
                lineHeight: 1,
                padding: 0,
                width: 36,
              }}
              title="Verwijderen"
              type="button"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        className="btn btn-ghost btn-sm"
        onClick={addRow}
        style={{ marginTop: 12 }}
        type="button"
      >
        + Rij toevoegen
      </button>
    </div>
  )
}
