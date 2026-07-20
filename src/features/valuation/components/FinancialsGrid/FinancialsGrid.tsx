'use client'

import { useEffect, useMemo, useRef, useState, type FC } from 'react'

import {
  saveDcfNewInputs,
  saveFinancials,
} from '@features/valuation/actions'
import { DCF_SECTORCORRECTIE_BASE_MULTIPLE } from '@features/valuation/constants/dcf'
import {
  FIN_CURRENT_YEAR,
  FIN_YEARS,
} from '@features/valuation/constants/financials'
import {
  EBITDA_FORECAST_YEAR_COUNT,
  EBITDA_YEAR_WEIGHTS_DEFAULT,
} from '@features/valuation/constants/sectorMultiples'
import { computeAutoForecast } from '@features/valuation/lib/computeAutoForecast'
import { computeDisplayYears } from '@features/valuation/lib/computeDisplayYears'
import { computeNonLegalEntityAddon } from '@features/valuation/lib/computeNonLegalEntityAddon'
import { computeNormalizationsForYear } from '@features/valuation/lib/computeNormalizationsForYear'
import {
  computeSectorcorrectieFromMultiple,
  dcfNewCompute,
} from '@features/valuation/lib/dcfCompute'
import { formatDcfNum3 } from '@features/valuation/lib/dcfFormat'
import { deriveFinRow } from '@features/valuation/lib/deriveFinRow'
import {
  type DcfNewResolvedInputs,
  type FinancialYearInput,
} from '@features/valuation/types'
import { MoneyInput } from '@shared/components/MoneyInput'
import { useToastStore } from '@shared/store/toast'
import { cn } from '@shared/utils/cn'

import { FIN_ROWS, FIN_WEIGHT_OPTIONS } from './constants'
import { FIN_DCF_EXTRA_ROWS } from './dcfRows'
import { FinDerivedValueCell } from './FinDerivedValueCell'
import { type Props } from './types'

const emptyYearInput = (year: number): FinancialYearInput => ({
  year,
  cogs: null,
  depreciation: null,
  interest: null,
  operatingExpenses: null,
  revenue: null,
  taxesPaid: null,
})

const buildInitialFin = (
  initialYears: FinancialYearInput[],
): Record<number, FinancialYearInput> => {
  const byYear = new Map(initialYears.map(row => [row.year, row]))
  const result: Record<number, FinancialYearInput> = {}

  for (const year of FIN_YEARS) {
    result[year] = byYear.get(year) ?? emptyYearInput(year)
  }

  return result
}

export const FinancialsGrid: FC<Props> = ({
  autoForecastDefault,
  dcfAdminDefaults,
  dcfInputs,
  extractionApply,
  initialYears,
  lastClosedYear: lastClosedYearDefault,
  nonLegalEntity,
  normalizations,
  onDcfInputsChange,
  onLastClosedYearChange,
  sectorMultiple,
  valuationSettings,
}) => {
  const [finState, setFinState] = useState(() => buildInitialFin(initialYears))
  const [lastClosedYear, setLastClosedYear] = useState(lastClosedYearDefault)
  const [autoForecast, setAutoForecast] = useState(autoForecastDefault)
  const [weightOverrides, setWeightOverrides] = useState<
    Record<number, number>
  >({})
  const [showExtended, setShowExtended] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const lastAppliedTokenRef = useRef<number | null>(null)
  const showToast = useToastStore(state => state.showToast)

  const dcfApplyEnabled = valuationSettings.dcfApplyEnabled

  const { forecastYears, historicalYears, restYear } = useMemo(
    () =>
      computeDisplayYears(
        lastClosedYear,
        dcfInputs.scenarioYearCount,
        dcfApplyEnabled,
      ),
    [lastClosedYear, dcfInputs.scenarioYearCount, dcfApplyEnabled],
  )

  const displayYears = useMemo(
    () =>
      restYear !== null
        ? [...historicalYears, ...forecastYears, restYear]
        : [...historicalYears, ...forecastYears],
    [historicalYears, forecastYears, restYear],
  )

  // Ports legacy's weightCfg (osago-bundle.js:8797-8800, 9348-9384): the two
  // weighting modes can be on independently, and each governs a different
  // subset of years getting a weighting dropdown (vs a plain "—").
  const weightCfg = useMemo(
    () => ({
      forecast: valuationSettings.forecastIncluded,
      historical:
        valuationSettings.historyIncluded &&
        valuationSettings.adjustHistoryWeights,
    }),
    [
      valuationSettings.forecastIncluded,
      valuationSettings.historyIncluded,
      valuationSettings.adjustHistoryWeights,
    ],
  )
  const showAnyWeights = weightCfg.historical || weightCfg.forecast

  const yearHasWeightSelect = (year: number, isFuture: boolean): boolean => {
    if (isFuture) {
      return weightCfg.forecast
    }
    if (weightCfg.historical) {
      return true
    }
    if (weightCfg.forecast) {
      return year === lastClosedYear
    }
    return false
  }

  const defaultWeightForYear = (year: number, isFuture: boolean): number => {
    if (isFuture && weightCfg.forecast) {
      const offset = year - lastClosedYear
      if (offset === 1) {
        return EBITDA_YEAR_WEIGHTS_DEFAULT.forecast1
      }
      if (offset === 2) {
        return EBITDA_YEAR_WEIGHTS_DEFAULT.forecast2
      }
      if (offset === EBITDA_FORECAST_YEAR_COUNT) {
        return EBITDA_YEAR_WEIGHTS_DEFAULT.forecast3
      }
      return 1
    }
    if (!isFuture && year === lastClosedYear && weightCfg.forecast) {
      return EBITDA_YEAR_WEIGHTS_DEFAULT.lastClosed
    }
    return 1
  }

  useEffect(() => {
    if (
      !extractionApply ||
      extractionApply.token === lastAppliedTokenRef.current
    ) {
      return
    }
    lastAppliedTokenRef.current = extractionApply.token

    const displayYearSet = new Set(displayYears)
    setFinState(prev => {
      const next = { ...prev }
      for (const extracted of extractionApply.years) {
        if (!displayYearSet.has(extracted.year)) {
          continue
        }
        const existing = next[extracted.year] ?? emptyYearInput(extracted.year)
        next[extracted.year] = {
          year: extracted.year,
          cogs: extracted.cogs ?? existing.cogs,
          depreciation: extracted.depreciation ?? existing.depreciation,
          interest: extracted.interest ?? existing.interest,
          operatingExpenses:
            extracted.operatingExpenses ?? existing.operatingExpenses,
          revenue: extracted.revenue ?? existing.revenue,
          taxesPaid: extracted.taxesPaid ?? existing.taxesPaid,
        }
      }
      return next
    })
  }, [extractionApply, displayYears])

  const autoForecastValues = useMemo(
    () =>
      autoForecast
        ? computeAutoForecast(displayYears, lastClosedYear, finState)
        : {},
    [autoForecast, displayYears, lastClosedYear, finState],
  )

  const effectiveFin = useMemo(() => {
    const merged: Record<number, FinancialYearInput> = {}

    for (const year of displayYears) {
      const base = finState[year] ?? emptyYearInput(year)
      const override = autoForecastValues[year]
      merged[year] = override ? { ...base, ...override, year } : base
    }

    return merged
  }, [displayYears, finState, autoForecastValues])

  const nonLegalEntityAddon = useMemo(
    () => computeNonLegalEntityAddon(nonLegalEntity),
    [nonLegalEntity],
  )

  const derivedRows = useMemo(() => {
    const result: Record<number, ReturnType<typeof deriveFinRow>> = {}

    for (const year of displayYears) {
      result[year] = deriveFinRow(effectiveFin[year], {
        normalizationsAddon: computeNormalizationsForYear(normalizations, year),
        operatingExpensesAddon: nonLegalEntityAddon,
      })
    }

    return result
  }, [displayYears, effectiveFin, nonLegalEntityAddon, normalizations])

  // DCF scenario rows (Investeringen/Aflossingen/FCF/DF/CW/EBIT/NOPLAT). Ports
  // legacy buildFinDcfExtras (osago-bundle.js:8476-8542): forces the scenario
  // to start at lastClosedYear + 1 so the berekening years line up with the
  // grid columns, and — when auto-forecast is on — projects investeringen /
  // aflossingen for the future years from their average historical revenue
  // ratio before computing.
  const dcfBerekening = useMemo(() => {
    if (!dcfApplyEnabled) {
      return null
    }

    const futureYears =
      restYear !== null ? [...forecastYears, restYear] : forecastYears

    let { aflossingen, investeringen } = dcfInputs
    if (autoForecast) {
      const project = (
        source: Record<number, number>,
      ): Record<number, number> => {
        const ratios: number[] = []
        for (const year of historicalYears) {
          const revenue = effectiveFin[year]?.revenue ?? null
          const value = source[year]
          if (
            revenue !== null &&
            revenue > 0 &&
            typeof value === 'number' &&
            value !== 0
          ) {
            ratios.push(value / revenue)
          }
        }
        const ratio = ratios.length
          ? ratios.reduce((sum, current) => sum + current, 0) / ratios.length
          : 0
        const next = { ...source }
        for (const year of futureYears) {
          next[year] = Math.round((effectiveFin[year]?.revenue ?? 0) * ratio)
        }
        return next
      }
      investeringen = project(dcfInputs.investeringen)
      aflossingen = project(dcfInputs.aflossingen)
    }

    const resolved: DcfNewResolvedInputs = {
      ...dcfInputs,
      aflossingen,
      investeringen,
      scenarioStartYear: lastClosedYear + 1,
      ip: dcfAdminDefaults.liquiditeitspremie,
      mrp: dcfAdminDefaults.mrp,
      rfr: dcfAdminDefaults.rfr,
      sectoropslag: computeSectorcorrectieFromMultiple(
        sectorMultiple ?? DCF_SECTORCORRECTIE_BASE_MULTIPLE,
      ),
    }

    return dcfNewCompute(resolved, effectiveFin, normalizations).berekening
  }, [
    dcfApplyEnabled,
    lastClosedYear,
    restYear,
    forecastYears,
    historicalYears,
    dcfInputs,
    autoForecast,
    effectiveFin,
    dcfAdminDefaults,
    sectorMultiple,
    normalizations,
  ])

  const onDcfMapChange = (
    mapKey: 'aflossingen' | 'investeringen',
    year: number,
    value: number | null,
  ): void => {
    onDcfInputsChange({
      ...dcfInputs,
      [mapKey]: { ...dcfInputs[mapKey], [year]: value ?? 0 },
    })
  }

  const onFieldChange = (
    year: number,
    field: keyof FinancialYearInput,
    value: number | null,
  ): void => {
    if (field === 'year') {
      return
    }
    setFinState(prev => ({
      ...prev,
      [year]: { ...(prev[year] ?? emptyYearInput(year)), [field]: value },
    }))
  }

  const onWeightChange = (year: number, rawValue: string): void => {
    setWeightOverrides(prev => ({ ...prev, [year]: Number(rawValue) }))
  }

  const onSave = async (): Promise<void> => {
    setIsSaving(true)

    const finForSave: Record<number, FinancialYearInput> = { ...finState }

    if (autoForecast) {
      for (const year of forecastYears) {
        const override = autoForecastValues[year]
        if (override) {
          finForSave[year] = { ...finForSave[year], ...override, year }
        }
      }
    }

    const result = await saveFinancials({
      autoForecast,
      lastClosedYear,
      nonLegalEntityValuation: nonLegalEntity,
      years: Object.values(finForSave),
    })

    // Investeringen/Aflossingen edited in the scenario grid live on
    // dcfNewInputs, so persist those alongside the financials when DCF is on.
    const dcfResult = dcfApplyEnabled
      ? await saveDcfNewInputs({
          ...dcfInputs,
          scenarioStartYear: lastClosedYear + 1,
        })
      : null

    setIsSaving(false)

    const error = result.error ?? dcfResult?.error ?? null
    if (error) {
      showToast(error, 'error')
      return
    }

    showToast('Financiële gegevens opgeslagen.')
  }

  return (
    <div className="card">
      <div className="form-section">
        <h3 className="form-section-title">Financiële gegevens</h3>

        <div
          style={{
            alignItems: 'flex-end',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '24px',
            justifyContent: 'space-between',
            marginBottom: '18px',
          }}
        >
          <div
            className="field"
            style={{ flex: 1, marginBottom: 0, maxWidth: 480, minWidth: 280 }}
          >
            <label>
              Van welk jaar is de laatste afgeronde jaarrekening beschikbaar?
            </label>
            <select
              onChange={event => {
                const year = Number(event.target.value)
                setLastClosedYear(year)
                onLastClosedYearChange?.(year)
              }}
              style={{ maxWidth: '140px', minWidth: '100px', width: 'auto' }}
              value={lastClosedYear}
            >
              {FIN_YEARS.filter(year => year <= FIN_CURRENT_YEAR).map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <label className="toggle-switch" style={{ paddingBottom: '8px' }}>
            <input
              checked={autoForecast}
              onChange={event => setAutoForecast(event.target.checked)}
              type="checkbox"
            />
            <span className="toggle-track" />
            <span className="toggle-label">
              Auto forecast
              <span
                aria-label="Prognosejaren automatisch berekenen"
                className="info-tip"
                data-tip="Prognosejaren automatisch berekenen"
                tabIndex={0}
              >
                i
              </span>
            </span>
          </label>
        </div>

        <div
          className={cn('fin-table-wrap', dcfApplyEnabled && 'fin-scenario-mode')}
        >
          <table className="fin-table">
            <thead>
              <tr>
                <th />
                {displayYears.map(year => (
                  <th
                    className={cn(
                      'fin-period',
                      year > lastClosedYear && 'future',
                      year === restYear && 'fin-period-rest',
                    )}
                    key={year}
                  >
                    <span className="fin-period-year">{year}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FIN_ROWS.map(row => (
                <tr
                  className={cn(
                    row.kind !== 'input' && 'fin-derived',
                    row.kind === 'soft-derived' && 'fin-derived-soft',
                  )}
                  key={row.key}
                >
                  <td className="fin-row-label">
                    {row.label}
                    {row.kind !== 'input' && (
                      <span
                        className="info-tip"
                        data-tip={row.tooltip}
                        tabIndex={0}
                      >
                        i
                      </span>
                    )}
                  </td>
                  {displayYears.map(year => {
                    if (row.kind === 'input') {
                      const isDisabled = year > lastClosedYear && autoForecast
                      return (
                        <td
                          className={cn(
                            'fin-cell',
                            isDisabled && 'auto-forecast',
                          )}
                          key={year}
                        >
                          <MoneyInput
                            isDisabled={isDisabled}
                            onChange={value =>
                              onFieldChange(year, row.key, value)
                            }
                            placeholder={isDisabled ? 'auto' : '0'}
                            value={effectiveFin[year]?.[row.key] ?? null}
                          />
                        </td>
                      )
                    }
                    const cellClass =
                      row.kind === 'soft-derived'
                        ? 'fin-cell derived soft-derived'
                        : 'fin-cell derived'
                    return (
                      <td className={cellClass} key={year}>
                        <FinDerivedValueCell
                          value={derivedRows[year]?.[row.key] ?? null}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}

              {dcfApplyEnabled &&
                FIN_DCF_EXTRA_ROWS.filter(
                  row => !row.extended || showExtended,
                ).map(row => {
                  if (row.editable) {
                    const mapKey = row.key as 'aflossingen' | 'investeringen'
                    return (
                      <tr key={row.key}>
                        <td className="fin-row-label">{row.label}</td>
                        {displayYears.map(year => {
                          const isDisabled =
                            autoForecast && year > lastClosedYear
                          const raw =
                            dcfBerekening?.data[year]?.[row.key] ?? null
                          const numeric =
                            typeof raw === 'number' && isFinite(raw) ? raw : null
                          return (
                            <td
                              className={cn(
                                'fin-cell',
                                isDisabled && 'auto-forecast',
                              )}
                              key={year}
                            >
                              <MoneyInput
                                isDisabled={isDisabled}
                                onChange={value =>
                                  onDcfMapChange(mapKey, year, value)
                                }
                                placeholder={isDisabled ? 'auto' : '0'}
                                value={numeric !== 0 ? numeric : null}
                              />
                            </td>
                          )
                        })}
                      </tr>
                    )
                  }

                  return (
                    <tr className="fin-derived" key={row.key}>
                      <td className="fin-row-label">{row.label}</td>
                      {displayYears.map(year => {
                        const raw = dcfBerekening?.data[year]?.[row.key] ?? null
                        const numeric =
                          typeof raw === 'number' && isFinite(raw) ? raw : null
                        const display =
                          numeric === null
                            ? '—'
                            : row.dec3
                              ? formatDcfNum3(numeric)
                              : Math.round(numeric).toLocaleString('nl-NL')
                        return (
                          <td className="fin-cell derived" key={year}>
                            <span
                              className={cn(
                                'fin-derived-value',
                                numeric === null && 'zero',
                                row.dec3 && 'no-currency',
                              )}
                            >
                              {display}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}

              {showAnyWeights && (
                <tr className="fin-weighting-row">
                  <td className="fin-row-label">Wegingsfactor</td>
                  {displayYears.map(year => {
                    const isFuture = year > lastClosedYear
                    if (!yearHasWeightSelect(year, isFuture)) {
                      return (
                        <td className="fin-cell" key={year}>
                          <span
                            style={{
                              color: 'var(--muted)',
                              display: 'block',
                              padding: '0 10px',
                              textAlign: 'right',
                            }}
                          >
                            —
                          </span>
                        </td>
                      )
                    }
                    const value =
                      weightOverrides[year] ??
                      defaultWeightForYear(year, isFuture)
                    return (
                      <td className="fin-cell" key={year}>
                        <select
                          className="fin-weight-select"
                          onChange={event =>
                            onWeightChange(year, event.target.value)
                          }
                          value={value}
                        >
                          {FIN_WEIGHT_OPTIONS.map(weight => (
                            <option key={weight} value={weight}>
                              {weight}
                            </option>
                          ))}
                        </select>
                      </td>
                    )
                  })}
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {dcfApplyEnabled && (
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '14px',
            }}
          >
            <label className="toggle-switch" style={{ margin: 0 }}>
              <input
                checked={showExtended}
                onChange={event => setShowExtended(event.target.checked)}
                type="checkbox"
              />
              <span className="toggle-track" />
              <span className="toggle-label">Uitgebreide data tonen</span>
            </label>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          justifyContent: 'flex-end',
        }}
      >
        <button
          className="btn btn-primary"
          disabled={isSaving}
          onClick={() => void onSave()}
          type="button"
        >
          {isSaving ? 'Bezig...' : 'Financiën opslaan'}
        </button>
      </div>
    </div>
  )
}
