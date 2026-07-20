'use client'

import { useState, type FC } from 'react'

import { saveValuationSettings } from '@features/valuation/actions'
import { type ValuationSettings } from '@features/valuation/types'

import { type Props } from './types'

export const ValuationSettingsPanel: FC<Props> = ({ initialSettings }) => {
  const [settings, setSettings] = useState<ValuationSettings>(initialSettings)
  const [saveError, setSaveError] = useState<string | null>(null)

  const persist = async (next: ValuationSettings): Promise<void> => {
    const result = await saveValuationSettings(next)
    setSaveError(result.error)
  }

  const applySettings = (next: ValuationSettings): void => {
    setSettings(next)
    void persist(next)
  }

  const onHistoryIncludedChange = (checked: boolean): void => {
    applySettings({
      ...settings,
      adjustHistoryWeights: checked ? settings.adjustHistoryWeights : false,
      historyIncluded: checked,
    })
  }

  const onAdjustHistoryWeightsChange = (checked: boolean): void => {
    applySettings({ ...settings, adjustHistoryWeights: checked })
  }

  const onForecastIncludedChange = (checked: boolean): void => {
    applySettings({ ...settings, forecastIncluded: checked })
  }

  const onDcfApplyEnabledChange = (checked: boolean): void => {
    applySettings({
      ...settings,
      dcfApplyEnabled: checked,
      manualMultipleEnabled: checked ? false : settings.manualMultipleEnabled,
    })
  }

  const onManualMultipleEnabledChange = (checked: boolean): void => {
    applySettings({
      ...settings,
      dcfApplyEnabled: checked ? false : settings.dcfApplyEnabled,
      manualMultipleEnabled: checked,
    })
  }

  const onManualMultipleValueChange = (rawValue: string): void => {
    setSettings(prev => ({
      ...prev,
      manualMultipleValue: rawValue === '' ? null : Number(rawValue),
    }))
  }

  const onManualMultipleValueBlur = (): void => {
    void persist(settings)
  }

  return (
    <div className="card">
      <div className="form-section">
        <h3 className="form-section-title">Waarderingsinstellingen</h3>
        <p className="form-section-desc">
          Schakelaars waarmee je de berekening van de waardering verder kunt
          fijnregelen.
        </p>

        <div
          className="alert"
          style={{
            background: '#FEF7E6',
            borderLeft: '3px solid #D97706',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--ink)',
            fontSize: '13px',
            lineHeight: 1.5,
            marginTop: '14px',
            padding: '14px 16px',
          }}
        >
          <strong style={{ color: '#92400E' }}>Let op:</strong> Door onderstaande
          instellingen aan te passen, pas je ook de manier waarop de
          waardebepaling gemaakt wordt aan. Standaard passen we de juiste
          instellingen voor jouw bedrijf toe. Wanneer je hier aanpassingen maakt
          die voor jouw situatie niet passend zijn, kan de waardering foutief
          zijn.
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            marginTop: '14px',
          }}
        >
          <label className="toggle-switch">
            <input
              checked={settings.historyIncluded}
              onChange={event => onHistoryIncludedChange(event.target.checked)}
              type="checkbox"
            />
            <span className="toggle-track" />
            <span className="toggle-label">Historische jaren meenemen</span>
          </label>

          {settings.historyIncluded && (
            <label className="toggle-switch">
              <input
                checked={settings.adjustHistoryWeights}
                onChange={event =>
                  onAdjustHistoryWeightsChange(event.target.checked)
                }
                type="checkbox"
              />
              <span className="toggle-track" />
              <span className="toggle-label">Wegingen per jaar aanpassen</span>
            </label>
          )}

          <label className="toggle-switch">
            <input
              checked={settings.forecastIncluded}
              onChange={event => onForecastIncludedChange(event.target.checked)}
              type="checkbox"
            />
            <span className="toggle-track" />
            <span className="toggle-label">Prognose meenemen</span>
          </label>

          <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
            <label className="toggle-switch" style={{ margin: 0 }}>
              <input
                checked={settings.dcfApplyEnabled}
                onChange={event => onDcfApplyEnabledChange(event.target.checked)}
                type="checkbox"
              />
              <span className="toggle-track" />
              <span className="toggle-label">Pas DCF-waardering toe</span>
            </label>
            <span
              aria-label="Toelichting Pas DCF-waardering toe"
              className="info-tip"
              data-tip="Door deze functie te activeren, passen we de DCF waarderingsmethodiek toe. Wanneer deze functie uit staat, hanteren we de EBITDA-multiple methodiek."
              tabIndex={0}
            >
              i
            </span>
          </div>

          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              gap: '8px',
              opacity: settings.dcfApplyEnabled ? 0.5 : undefined,
            }}
          >
            <label
              className="toggle-switch"
              style={{ margin: 0 }}
              title={
                settings.dcfApplyEnabled
                  ? "Zet eerst 'Pas DCF-waardering toe' uit om deze optie te gebruiken."
                  : undefined
              }
            >
              <input
                checked={settings.manualMultipleEnabled}
                disabled={settings.dcfApplyEnabled}
                onChange={event =>
                  onManualMultipleEnabledChange(event.target.checked)
                }
                type="checkbox"
              />
              <span className="toggle-track" />
              <span className="toggle-label">
                Ik wil handmatig een EBITDA-multiple ingeven voor de waardering
              </span>
            </label>
          </div>

          {settings.manualMultipleEnabled && !settings.dcfApplyEnabled && (
            <div style={{ marginLeft: '52px', marginTop: '-4px' }}>
              <div
                style={{
                  alignItems: 'center',
                  display: 'inline-flex',
                  gap: '6px',
                }}
              >
                <input
                  min="0"
                  onBlur={onManualMultipleValueBlur}
                  onChange={event =>
                    onManualMultipleValueChange(event.target.value)
                  }
                  step="0.1"
                  style={{
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontVariantNumeric: 'tabular-nums',
                    padding: '6px 10px',
                    width: '90px',
                  }}
                  type="number"
                  value={settings.manualMultipleValue ?? ''}
                />
                <span
                  style={{
                    color: 'var(--muted)',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  ×
                </span>
              </div>
            </div>
          )}
        </div>

        {saveError && <div className="alert alert-error mt-3">{saveError}</div>}
      </div>
    </div>
  )
}
