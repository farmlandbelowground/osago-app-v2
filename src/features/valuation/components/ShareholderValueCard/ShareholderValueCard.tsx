'use client'

import { useMemo, useState, type FC, type ReactNode } from 'react'

import { saveShareholderValueInputs } from '@features/valuation/actions'
import {
  FIN_CURRENT_YEAR,
  FIN_YEARS,
} from '@features/valuation/constants/financials'
import { computeAandeelhouderswaardeVerrekeningBreakdown } from '@features/valuation/lib/computeAandeelhouderswaardeVerrekening'
import {
  type ShareholderValueInputs,
  type WorkingCapitalExtraItem,
} from '@features/valuation/types'
import { MoneyInput } from '@shared/components/MoneyInput'
import { useToastStore } from '@shared/store/toast'

import {
  BALANCE_YEAR_OPTION_COUNT,
  FIELD_ROW_GRID_STYLE,
  NEGATIVE_AMOUNT_COLOR,
  TOTALE_KOSTEN_MONTHS_OPTIONS,
} from './constants'
import { type Props } from './types'

interface FieldRowProps {
  children: ReactNode
  label: ReactNode
}

const FieldRow: FC<FieldRowProps> = ({ children, label }) => (
  <div style={FIELD_ROW_GRID_STYLE}>
    <label style={{ color: 'var(--ink)', fontSize: '14px' }}>{label}</label>
    {children}
    <span />
  </div>
)

interface ReadOnlyAmountProps {
  value: number
  isNegativeHighlighted?: boolean
}

const ReadOnlyAmount: FC<ReadOnlyAmountProps> = ({
  isNegativeHighlighted,
  value,
}) => (
  <div className="fin-input-wrap" style={{ background: 'var(--line-soft)' }}>
    <span className="fin-input-prefix">€</span>
    <input
      readOnly
      style={{
        background: 'transparent',
        color:
          isNegativeHighlighted && value < 0
            ? NEGATIVE_AMOUNT_COLOR
            : 'var(--ink)',
        fontWeight: 600,
      }}
      tabIndex={-1}
      type="text"
      value={value.toLocaleString('nl-NL')}
    />
  </div>
)

interface ExtrasListProps {
  items: WorkingCapitalExtraItem[]
  onAdd: () => void
  onChange: (items: WorkingCapitalExtraItem[]) => void
}

const ExtrasList: FC<ExtrasListProps> = ({ items, onAdd, onChange }) => (
  <>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {items.map(item => (
        <div key={item.id} style={FIELD_ROW_GRID_STYLE}>
          <input
            onChange={event =>
              onChange(
                items.map(existing =>
                  existing.id === item.id
                    ? { ...existing, label: event.target.value }
                    : existing,
                ),
              )
            }
            placeholder="Naam"
            style={{ fontSize: '14px', padding: '8px 12px' }}
            type="text"
            value={item.label}
          />
          <MoneyInput
            onChange={amount =>
              onChange(
                items.map(existing =>
                  existing.id === item.id
                    ? { ...existing, amount: amount ?? 0 }
                    : existing,
                ),
              )
            }
            value={item.amount}
          />
          <button
            className="btn btn-ghost btn-sm"
            onClick={() =>
              onChange(items.filter(existing => existing.id !== item.id))
            }
            type="button"
          >
            ×
          </button>
        </div>
      ))}
    </div>
    <div>
      <button className="btn btn-ghost btn-sm" onClick={onAdd} type="button">
        + Veld toevoegen
      </button>
    </div>
  </>
)

export const ShareholderValueCard: FC<Props> = ({
  financials,
  initialValue,
  lastClosedYear,
}) => {
  const finRow = financials[lastClosedYear]
  const [value, setValue] = useState<ShareholderValueInputs>({
    ...initialValue,
    bedrijfskostenV2:
      initialValue.bedrijfskostenV2 ?? finRow?.operatingExpenses ?? null,
    kostprijsOmzetV2: initialValue.kostprijsOmzetV2 ?? finRow?.cogs ?? null,
  })
  const [balanceYear, setBalanceYear] = useState(
    value.lastClosedBalanceYear ?? lastClosedYear,
  )
  const [isSaving, setIsSaving] = useState(false)
  const showToast = useToastStore(state => state.showToast)

  const breakdown = useMemo(
    () =>
      computeAandeelhouderswaardeVerrekeningBreakdown({
        financials,
        lastClosedYear,
        shareholderValue: value,
      }),
    [financials, lastClosedYear, value],
  )

  const onSave = async (): Promise<void> => {
    setIsSaving(true)
    const result = await saveShareholderValueInputs({
      ...value,
      lastClosedBalanceYear: balanceYear,
    })
    setIsSaving(false)

    if (result.error) {
      showToast(result.error, 'error')
      return
    }

    showToast('Aandeelhouderswaarde opgeslagen.')
  }

  return (
    <div className="card" style={{ marginTop: '24px' }}>
      <div className="form-section" style={{ marginBottom: 0 }}>
        <h3 className="form-section-title">Aandeelhouderswaarde</h3>

        <div
          className="field"
          style={{ marginBottom: '14px', marginTop: '8px', maxWidth: 480 }}
        >
          <label>
            Van welk jaar is de laatste afgeronde balans beschikbaar?
          </label>
          <select
            onChange={event => setBalanceYear(Number(event.target.value))}
            style={{ maxWidth: '140px', minWidth: '100px', width: 'auto' }}
            value={balanceYear}
          >
            {FIN_YEARS.filter(year => year <= FIN_CURRENT_YEAR)
              .slice(-BALANCE_YEAR_OPTION_COUNT)
              .reverse()
              .map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
          </select>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginTop: '8px',
          }}
        >
          <h4
            style={{
              borderBottom: '1px solid var(--line)',
              color: 'var(--green-dark)',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.05em',
              margin: '0 0 4px',
              paddingBottom: '6px',
              textTransform: 'uppercase',
            }}
          >
            Werkkapitaal berekening
          </h4>

          <FieldRow
            label={
              <>
                Kostprijs van de omzet{' '}
                <span className="text-xs text-muted">
                  (uit de jaarrekening van {lastClosedYear})
                </span>
              </>
            }
          >
            <MoneyInput
              onChange={amount =>
                setValue(prev => ({ ...prev, kostprijsOmzetV2: amount }))
              }
              value={value.kostprijsOmzetV2}
            />
          </FieldRow>

          <FieldRow
            label={
              <>
                Bedrijfskosten{' '}
                <span className="text-xs text-muted">
                  (uit de jaarrekening van {lastClosedYear})
                </span>
              </>
            }
          >
            <MoneyInput
              onChange={amount =>
                setValue(prev => ({ ...prev, bedrijfskostenV2: amount }))
              }
              value={value.bedrijfskostenV2}
            />
          </FieldRow>

          <FieldRow
            label={
              <span
                style={{
                  alignItems: 'center',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <span>Totale kosten</span>
                <select
                  onChange={event =>
                    setValue(prev => ({
                      ...prev,
                      totaleKostenMaandenV2: Number(event.target.value),
                    }))
                  }
                  style={{
                    background: '#fff',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius)',
                    maxWidth: '140px',
                    minWidth: '100px',
                    padding: '12px 32px 12px 14px',
                    width: 'auto',
                  }}
                  value={value.totaleKostenMaandenV2 ?? 1}
                >
                  {TOTALE_KOSTEN_MONTHS_OPTIONS.map(months => (
                    <option key={months} value={months}>
                      {months} {months === 1 ? 'maand' : 'maanden'}
                    </option>
                  ))}
                </select>
              </span>
            }
          >
            <ReadOnlyAmount value={breakdown.totaleKosten} />
          </FieldRow>

          <FieldRow
            label={
              <>
                Debiteuren{' '}
                <span className="text-xs text-muted">
                  (uit de jaarrekening van {lastClosedYear})
                </span>
              </>
            }
          >
            <MoneyInput
              onChange={amount =>
                setValue(prev => ({ ...prev, debiteurenV2: amount }))
              }
              value={value.debiteurenV2}
            />
          </FieldRow>

          <FieldRow
            label={
              <>
                Crediteuren{' '}
                <span className="text-xs text-muted">
                  (uit de jaarrekening van {lastClosedYear})
                </span>
              </>
            }
          >
            <MoneyInput
              onChange={amount =>
                setValue(prev => ({ ...prev, crediteurenV2: amount }))
              }
              value={value.crediteurenV2}
            />
          </FieldRow>

          <ExtrasList
            items={value.werkkapitaalExtrasV2}
            onAdd={() =>
              setValue(prev => ({
                ...prev,
                werkkapitaalExtrasV2: [
                  ...prev.werkkapitaalExtrasV2,
                  { amount: 0, id: `wke_${Date.now()}`, label: '' },
                ],
              }))
            }
            onChange={items =>
              setValue(prev => ({ ...prev, werkkapitaalExtrasV2: items }))
            }
          />

          <FieldRow label="Aanwezig werkkapitaal">
            <ReadOnlyAmount value={breakdown.werkkapitaal} />
          </FieldRow>

          <FieldRow label="Verrekening werkkapitaal">
            <ReadOnlyAmount
              isNegativeHighlighted
              value={breakdown.positieWerkkap}
            />
          </FieldRow>

          <h4
            style={{
              borderBottom: '1px solid var(--line)',
              color: 'var(--green-dark)',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.05em',
              margin: '18px 0 4px',
              paddingBottom: '6px',
              textTransform: 'uppercase',
            }}
          >
            Debt en cash free verrekening
          </h4>

          <FieldRow
            label={
              <>
                Liquide middelen{' '}
                <span className="text-xs text-muted">
                  (uit de jaarrekening van {lastClosedYear})
                </span>
              </>
            }
          >
            <MoneyInput
              onChange={amount =>
                setValue(prev => ({ ...prev, liquideMiddelenV2: amount }))
              }
              value={value.liquideMiddelenV2}
            />
          </FieldRow>

          <FieldRow
            label={
              <>
                Reservering vakantiegeld{' '}
                <span className="text-xs text-muted">
                  (uit de jaarrekening van {lastClosedYear})
                </span>
              </>
            }
          >
            <MoneyInput
              onChange={amount =>
                setValue(prev => ({ ...prev, vakantiegeldV2: amount }))
              }
              value={value.vakantiegeldV2}
            />
          </FieldRow>

          <FieldRow
            label={
              <>
                Kortlopende schulden{' '}
                <span className="text-xs text-muted">
                  (uit de jaarrekening van {lastClosedYear})
                </span>
              </>
            }
          >
            <MoneyInput
              onChange={amount =>
                setValue(prev => ({ ...prev, kortlopendeSchuldenV2: amount }))
              }
              value={value.kortlopendeSchuldenV2}
            />
          </FieldRow>

          <ExtrasList
            items={value.dcfreeExtrasV2}
            onAdd={() =>
              setValue(prev => ({
                ...prev,
                dcfreeExtrasV2: [
                  ...prev.dcfreeExtrasV2,
                  { amount: 0, id: `dfe_${Date.now()}`, label: '' },
                ],
              }))
            }
            onChange={items =>
              setValue(prev => ({ ...prev, dcfreeExtrasV2: items }))
            }
          />

          <FieldRow label="Debt en cash free verrekening">
            <ReadOnlyAmount isNegativeHighlighted value={breakdown.dcfree} />
          </FieldRow>

          <div
            style={{
              alignItems: 'center',
              borderTop: '2px solid var(--line)',
              display: 'grid',
              gap: '10px',
              gridTemplateColumns: '1fr 200px 36px',
              marginTop: '6px',
              paddingTop: '10px',
            }}
          >
            <label
              style={{ color: 'var(--ink)', fontSize: '14px', fontWeight: 600 }}
            >
              Totale verrekening aandeelhouderswaarde
            </label>
            <div
              className="fin-input-wrap"
              style={{
                background: 'var(--green-soft)',
                borderColor: 'var(--green)',
              }}
            >
              <span className="fin-input-prefix">€</span>
              <input
                readOnly
                style={{
                  background: 'transparent',
                  color:
                    breakdown.total < 0
                      ? NEGATIVE_AMOUNT_COLOR
                      : 'var(--green-dark)',
                  fontSize: '15px',
                  fontWeight: 700,
                }}
                tabIndex={-1}
                type="text"
                value={breakdown.total.toLocaleString('nl-NL')}
              />
            </div>
            <span />
          </div>
        </div>
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
          {isSaving ? 'Bezig...' : 'Aandeelhouderswaarde opslaan'}
        </button>
      </div>
    </div>
  )
}
