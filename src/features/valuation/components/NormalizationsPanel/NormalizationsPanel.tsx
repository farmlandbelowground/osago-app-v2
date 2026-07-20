'use client'

import { useState, type FC } from 'react'

import { saveNormalizations } from '@features/valuation/actions'
import { type Normalization } from '@features/valuation/types'
import { MoneyInput } from '@shared/components/MoneyInput'
import { useToastStore } from '@shared/store/toast'
import { cn } from '@shared/utils/cn'

import { type Props } from './types'

const buildBlankNormalization = (applicableYears: number[]): Normalization => ({
  id: crypto.randomUUID(),
  amount: 0,
  name: '',
  years: [...applicableYears],
})

export const NormalizationsPanel: FC<Props> = ({
  applicableYears,
  initialNormalizations,
}) => {
  const [normalizations, setNormalizations] = useState<Normalization[]>(
    initialNormalizations,
  )
  const [isSaving, setIsSaving] = useState(false)
  const showToast = useToastStore(state => state.showToast)

  const onAddRow = (): void => {
    setNormalizations(prev => [
      ...prev,
      buildBlankNormalization(applicableYears),
    ])
  }

  const onRemoveRow = (id: string): void => {
    setNormalizations(prev => prev.filter(row => row.id !== id))
  }

  const onNameChange = (id: string, name: string): void => {
    setNormalizations(prev =>
      prev.map(row => (row.id === id ? { ...row, name } : row)),
    )
  }

  const onAmountChange = (id: string, amount: number | null): void => {
    setNormalizations(prev =>
      prev.map(row => (row.id === id ? { ...row, amount: amount ?? 0 } : row)),
    )
  }

  const onToggleYear = (id: string, year: number): void => {
    setNormalizations(prev =>
      prev.map(row => {
        if (row.id !== id) {
          return row
        }

        const effectiveYears = row.years ?? applicableYears
        const years = effectiveYears.includes(year)
          ? effectiveYears.filter(existing => existing !== year)
          : [...effectiveYears, year]

        return { ...row, years }
      }),
    )
  }

  const onSave = async (): Promise<void> => {
    setIsSaving(true)

    const result = await saveNormalizations(normalizations)

    setIsSaving(false)

    if (result.error) {
      showToast(result.error, 'error')
      return
    }

    showToast('Normaliseringen opgeslagen.')
  }

  return (
    <div className="card">
      <div className="form-section">
        <h3 className="form-section-title">Normaliseringen</h3>
        <p className="form-section-desc">
          Voeg correcties toe op je financiële cijfers — bijvoorbeeld eenmalige
          kosten, niet-marktconforme directeursbeloning of bijzondere baten.
          Bedragen kunnen positief of negatief zijn.
        </p>

        {normalizations.length === 0 ? (
          <div
            className="text-sm text-muted"
            style={{
              borderBottom: '1px solid var(--line-soft)',
              borderTop: '1px solid var(--line-soft)',
              marginTop: '14px',
              padding: '14px 0',
            }}
          >
            Nog geen normaliseringen toegevoegd. Klik op &quot;+ Normalisering
            toevoegen&quot; om te beginnen.
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              marginTop: '14px',
            }}
          >
            {normalizations.map((row, index) => {
              const effectiveYears = row.years ?? applicableYears

              return (
                <div
                  key={row.id}
                  style={{
                    border: '1px solid var(--line-soft)',
                    borderRadius: '8px',
                    padding: '14px 14px 12px',
                  }}
                >
                  <div
                    className="form-row"
                    style={{
                      alignItems: 'end',
                      gap: '10px',
                      gridTemplateColumns: '1fr 200px 36px',
                      marginBottom: 0,
                    }}
                  >
                    <div className="field" style={{ marginBottom: 0 }}>
                      {index === 0 && <label>Naam</label>}
                      <div className="fin-input-wrap fin-input-wrap--text">
                        <input
                          onChange={event =>
                            onNameChange(row.id, event.target.value)
                          }
                          placeholder="Bijv. Eenmalige juridische kosten"
                          type="text"
                          value={row.name}
                        />
                      </div>
                    </div>

                    <div className="field" style={{ marginBottom: 0 }}>
                      {index === 0 && <label>Bedrag</label>}
                      <MoneyInput
                        onChange={value => onAmountChange(row.id, value)}
                        value={row.amount === 0 ? null : row.amount}
                      />
                    </div>

                    <button
                      aria-label="Verwijderen"
                      className="btn btn-ghost"
                      onClick={() => onRemoveRow(row.id)}
                      style={{
                        color: 'var(--muted)',
                        fontSize: '18px',
                        height: '34px',
                        lineHeight: 1,
                        padding: 0,
                        width: '36px',
                      }}
                      title="Verwijderen"
                      type="button"
                    >
                      ×
                    </button>
                  </div>

                  <div
                    style={{
                      borderTop: '1px dashed var(--line-soft)',
                      marginTop: '12px',
                      paddingTop: '10px',
                    }}
                  >
                    <div
                      style={{
                        color: 'var(--muted)',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Jaren waarop deze correctie geldt
                    </div>
                    <div className="norm-years-grid">
                      {applicableYears.map(year => {
                        const isChecked = effectiveYears.includes(year)

                        return (
                          <label
                            className={cn(
                              'norm-year-pill',
                              isChecked && 'is-checked',
                            )}
                            key={year}
                          >
                            <input
                              checked={isChecked}
                              onChange={() => onToggleYear(row.id, year)}
                              type="checkbox"
                            />
                            <span>{year}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <button
          className="btn btn-ghost btn-sm"
          onClick={onAddRow}
          style={{ marginTop: '8px' }}
          type="button"
        >
          + Normalisering toevoegen
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end',
          marginTop: '18px',
        }}
      >
        <button
          className="btn btn-primary"
          disabled={isSaving}
          onClick={() => void onSave()}
          type="button"
        >
          {isSaving ? 'Bezig...' : 'Normaliseringen opslaan'}
        </button>
      </div>
    </div>
  )
}
