'use client'

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FC,
} from 'react'

import { saveDcfNewInputs } from '@features/valuation/actions'
import {
  DCF_ASSET_RISK_FACTORS,
  DCF_KLEIN_PREMIE_FACTORS,
  DCF_SECTORCORRECTIE_BASE_MULTIPLE,
  DCF_UITGANGSPUNTEN_DEFAULT,
} from '@features/valuation/constants/dcf'
import { dcfAllowedYearCounts } from '@features/valuation/lib/dcfAllowedYearCounts'
import {
  computeSectorcorrectieFromMultiple,
  dcfNewCompute,
} from '@features/valuation/lib/dcfCompute'
import {
  formatDcfDec4,
  formatDcfNum3,
  formatDcfPct2,
} from '@features/valuation/lib/dcfFormat'
import {
  type DcfNewResolvedInputs,
  type DcfNewUitgangspunten,
} from '@features/valuation/types'
import { useToastStore } from '@shared/store/toast'

import {
  DCF_ASSET_FIELDS,
  DCF_ASSET_RANGE,
  DCF_GROEIREST_OPTIONS,
  DCF_KLEIN_FIELDS,
  DCF_KLEIN_RANGE,
  DCF_VERMOGENSVOET_REST_PCT_RANGE,
  type DcfAssetFieldKey,
  type DcfKleinFieldKey,
} from './constants'

interface ScaleRange {
  max: number
  min: number
  step: number
}
import { type Props } from './types'

const MARKT_TIP =
  'We gebruiken hier marktconforme parameters, je kunt deze niet zelf aanpassen.'
const GROEIREST_EPSILON = 0.0001
const PERCENT_DIVISOR = 100

const GREEN_BOX: CSSProperties = {
  background: '#e8f5ec',
  border: '1px solid #94d3a2',
  borderRadius: '4px',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  padding: '6px 10px',
}
const SLIDER_EDGE: CSSProperties = {
  alignItems: 'center',
  color: 'var(--muted)',
  display: 'flex',
  fontSize: '10px',
  fontWeight: 500,
  justifyContent: 'space-between',
}
const SLIDER_VALUE: CSSProperties = {
  color: 'var(--ink)',
  fontSize: '12px',
  fontVariantNumeric: 'tabular-nums',
  fontWeight: 600,
}
const GRID_ROW: CSSProperties = {
  alignItems: 'center',
  display: 'grid',
  gap: '10px',
  gridTemplateColumns: '1fr 240px 90px',
}
const LABEL_STYLE: CSSProperties = { color: 'var(--ink)', fontSize: '14px' }
const LABEL_WITH_TIP: CSSProperties = {
  ...LABEL_STYLE,
  alignItems: 'center',
  display: 'flex',
  gap: '6px',
}
const DEC_STYLE: CSSProperties = {
  color: 'var(--muted)',
  fontSize: '12.5px',
  fontVariantNumeric: 'tabular-nums',
  textAlign: 'right',
}
const SELECT_WRAP: CSSProperties = { padding: 0 }
const SELECT_STYLE: CSSProperties = {
  appearance: 'none',
  background: 'transparent',
  border: 'none',
  color: 'var(--ink)',
  cursor: 'pointer',
  flex: 1,
  fontFamily: 'inherit',
  fontSize: '13px',
  height: '100%',
  outline: 'none',
  padding: '0 28px 0 10px',
}
const READONLY_INPUT: CSSProperties = {
  background: 'transparent',
  color: 'var(--ink)',
  fontWeight: 600,
}
const LABEL_TD: CSSProperties = {
  color: 'var(--ink)',
  fontSize: '13.5px',
  padding: '7px 12px 7px 0',
}
const NUM_TD: CSSProperties = {
  color: 'var(--ink)',
  fontSize: '13px',
  fontVariantNumeric: 'tabular-nums',
  padding: '7px 12px',
  textAlign: 'right',
}
const PILL_TD: CSSProperties = {
  padding: '7px 0 7px 12px',
  textAlign: 'right',
}
const SLIDER_TD: CSSProperties = { padding: '5px 8px' }
const DERIVED_PILL: CSSProperties = {
  background: 'var(--line-soft)',
  border: '1px solid var(--line)',
  borderRadius: '6px',
  color: 'var(--ink)',
  display: 'inline-block',
  fontSize: '13px',
  fontVariantNumeric: 'tabular-nums',
  fontWeight: 600,
  lineHeight: 1.2,
  minWidth: '90px',
  padding: '5px 12px',
  textAlign: 'right',
}
const DERIVED_PILL_BOLD: CSSProperties = { ...DERIVED_PILL, fontWeight: 700 }
const TOTAL_PILL: CSSProperties = {
  background: 'var(--green-soft)',
  border: '1px solid var(--green)',
  borderRadius: '6px',
  color: 'var(--green-dark)',
  display: 'inline-block',
  fontSize: '15px',
  fontVariantNumeric: 'tabular-nums',
  fontWeight: 700,
  lineHeight: 1.2,
  minWidth: '90px',
  padding: '7px 14px',
  textAlign: 'right',
}
const SECTION_HEADER_TD: CSSProperties = {
  borderBottom: '1px solid var(--line)',
  color: 'var(--green-dark)',
  fontSize: '14px',
  fontWeight: 600,
  letterSpacing: '0.05em',
  padding: '14px 0 6px',
  textTransform: 'uppercase',
}
const TOTAL_LABEL_TD: CSSProperties = {
  borderTop: '1px solid var(--line)',
  color: 'var(--ink)',
  fontSize: '13.5px',
  fontWeight: 600,
  padding: '10px 12px 10px 0',
}
const TOTAL_PILL_TD: CSSProperties = {
  borderTop: '1px solid var(--line)',
  padding: '10px 0 10px 12px',
  textAlign: 'right',
}
const KOSTENVOET_LABEL_TD: CSSProperties = {
  borderTop: '2px solid var(--line)',
  color: 'var(--ink)',
  fontSize: '14px',
  fontWeight: 600,
  padding: '14px 12px 12px 0',
}
const KOSTENVOET_PILL_TD: CSSProperties = {
  borderTop: '2px solid var(--line)',
  padding: '14px 0 12px 12px',
  textAlign: 'right',
}

const formatSliderValue = (value: number): string =>
  value.toFixed(2).replace('.', ',')
const formatScaleEdge = (value: number): string =>
  value % 1 === 0 ? String(value) : formatSliderValue(value)

interface SectionActionsProps {
  isSaving: boolean
  onReset: () => void
  onSave: () => void
}

const SectionActions: FC<SectionActionsProps> = ({
  isSaving,
  onReset,
  onSave,
}) => (
  <div
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      justifyContent: 'flex-end',
      marginTop: '18px',
    }}
  >
    <button
      className="btn btn-secondary btn-sm"
      onClick={onReset}
      type="button"
    >
      Standaardwaarden terugzetten
    </button>
    <button
      className="btn btn-primary btn-sm"
      disabled={isSaving}
      onClick={onSave}
      type="button"
    >
      Opslaan
    </button>
  </div>
)

const InfoTip: FC<{ label: string; tip: string }> = ({ label, tip }) => (
  <span aria-label={label} className="info-tip" data-tip={tip} tabIndex={0}>
    i
  </span>
)

export const DcfAssumptionsCard: FC<Props> = ({
  adminDefaults,
  bedrijfMarktOntwikkeling,
  dcfInputs,
  lastClosedYear,
  onChange,
  sectorMultiple,
}) => {
  const [isSaving, setIsSaving] = useState(false)
  const [isDiscOpen, setIsDiscOpen] = useState(false)
  const showToast = useToastStore(state => state.showToast)

  const allowedYearCounts = useMemo(
    () => dcfAllowedYearCounts(bedrijfMarktOntwikkeling),
    [bedrijfMarktOntwikkeling],
  )
  const yearCount = allowedYearCounts.includes(dcfInputs.scenarioYearCount)
    ? dcfInputs.scenarioYearCount
    : allowedYearCounts[0]

  // Snap a stored scenario-year count that is no longer allowed down to the
  // lowest permitted value, matching legacy dcfNewCompute's clamp.
  useEffect(() => {
    if (!allowedYearCounts.includes(dcfInputs.scenarioYearCount)) {
      onChange({ ...dcfInputs, scenarioYearCount: yearCount })
    }
  }, [allowedYearCounts, dcfInputs, onChange, yearCount])

  const startYear = lastClosedYear + 1
  const endYear = startYear + yearCount - 1
  const restStartYear = startYear + yearCount

  const resolvedInputs = useMemo<DcfNewResolvedInputs>(
    () => ({
      ...dcfInputs,
      scenarioStartYear: startYear,
      scenarioYearCount: yearCount,
      ip: adminDefaults.liquiditeitspremie,
      mrp: adminDefaults.mrp,
      rfr: adminDefaults.rfr,
      sectoropslag: computeSectorcorrectieFromMultiple(
        sectorMultiple ?? DCF_SECTORCORRECTIE_BASE_MULTIPLE,
      ),
    }),
    [dcfInputs, adminDefaults, sectorMultiple, startYear, yearCount],
  )

  const computeResult = useMemo(
    () => dcfNewCompute(resolvedInputs, {}, []),
    [resolvedInputs],
  )

  const uitgangspunten = dcfInputs.uitgangspunten
  const selectedGroeiRest =
    DCF_GROEIREST_OPTIONS.find(
      option =>
        Math.abs(option.value - uitgangspunten.groeiRest) < GROEIREST_EPSILON,
    )?.value ?? uitgangspunten.groeiRest

  const setUitgangspunt = (patch: Partial<DcfNewUitgangspunten>): void => {
    onChange({
      ...dcfInputs,
      uitgangspunten: { ...uitgangspunten, ...patch },
    })
  }

  const setKleinWaarde = (key: DcfKleinFieldKey, waarde: number): void => {
    onChange({
      ...dcfInputs,
      klein: { ...dcfInputs.klein, [key]: { ...dcfInputs.klein[key], waarde } },
    })
  }

  const setAssetWaarde = (key: DcfAssetFieldKey, waarde: number): void => {
    onChange({
      ...dcfInputs,
      asset: { ...dcfInputs.asset, [key]: { ...dcfInputs.asset[key], waarde } },
    })
  }

  const persist = async (label: string): Promise<void> => {
    setIsSaving(true)
    const result = await saveDcfNewInputs({
      ...dcfInputs,
      scenarioStartYear: startYear,
    })
    setIsSaving(false)

    if (result.error) {
      showToast(result.error, 'error')
      return
    }

    showToast(`${label} opgeslagen.`)
  }

  const resetUitgangspunten = (): void => {
    if (!window.confirm('Reset Uitgangspunten naar defaults?')) {
      return
    }
    onChange({ ...dcfInputs, uitgangspunten: { ...DCF_UITGANGSPUNTEN_DEFAULT } })
  }

  const resetWacc = (): void => {
    if (!window.confirm('Reset WACC-aannames naar defaults?')) {
      return
    }
    onChange({
      ...dcfInputs,
      asset: {
        act: { ...DCF_ASSET_RISK_FACTORS.act },
        rep: { ...DCF_ASSET_RISK_FACTORS.rep },
        toetr: { ...DCF_ASSET_RISK_FACTORS.toetr },
        trackR: { ...DCF_ASSET_RISK_FACTORS.trackR },
      },
      klein: {
        adh: { ...DCF_KLEIN_PREMIE_FACTORS.adh },
        afn: { ...DCF_KLEIN_PREMIE_FACTORS.afn },
        alr: { ...DCF_KLEIN_PREMIE_FACTORS.alr },
      },
    })
  }

  const renderScaleSlider = (
    value: number,
    range: ScaleRange,
    onValueChange: (next: number) => void,
  ): React.ReactNode => (
    <div style={GREEN_BOX}>
      <input
        className="dcf-new-input"
        max={range.max}
        min={range.min}
        onChange={event => onValueChange(Number(event.target.value))}
        step={range.step}
        type="range"
        value={value}
      />
      <div style={SLIDER_EDGE}>
        <span>laag ({formatScaleEdge(range.min)})</span>
        <span style={SLIDER_VALUE}>{formatSliderValue(value)}</span>
        <span>hoog ({formatScaleEdge(range.max)})</span>
      </div>
    </div>
  )

  const vermogensvoetPct = Math.round(
    uitgangspunten.vermogensvoetRest * PERCENT_DIVISOR,
  )

  return (
    <>
      <div className="card mt-5 mb-5">
        <h3 className="form-section-title" style={{ marginTop: 0 }}>
          Uitgangspunten DCF-waardering
        </h3>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginTop: '14px',
          }}
        >
          <div style={GRID_ROW}>
            <label style={LABEL_WITH_TIP}>
              <span>Aantal scenariojaren</span>
              <InfoTip
                label="Toelichting Aantal scenariojaren"
                tip="Als je op het scherm Mijn bedrijf hebt aangegeven dat er veel ontwikkelingen zijn in jouw bedrijf en/of markt, beperken we hier een korte scenarioperiode."
              />
            </label>
            <div className="fin-input-wrap" style={SELECT_WRAP}>
              <select
                onChange={event =>
                  onChange({
                    ...dcfInputs,
                    scenarioYearCount: Number(event.target.value),
                  })
                }
                style={SELECT_STYLE}
                value={yearCount}
              >
                {allowedYearCounts.map(count => (
                  <option key={count} value={count}>
                    {count} jaar
                  </option>
                ))}
              </select>
            </div>
            <span />
          </div>

          <div style={GRID_ROW}>
            <label style={LABEL_STYLE}>Scenarioperiode</label>
            <div
              className="fin-input-wrap fin-input-wrap--text"
              style={{ background: 'var(--line-soft)' }}
            >
              <input
                readOnly
                style={{ ...READONLY_INPUT, textAlign: 'left' }}
                tabIndex={-1}
                value={`${startYear} - ${endYear}`}
              />
            </div>
            <span />
          </div>

          <div style={GRID_ROW}>
            <label style={LABEL_STYLE}>Restperiode</label>
            <div
              className="fin-input-wrap fin-input-wrap--text"
              style={{ background: 'var(--line-soft)' }}
            >
              <input
                readOnly
                style={{ ...READONLY_INPUT, textAlign: 'left' }}
                tabIndex={-1}
                value={`vanaf ${restStartYear}`}
              />
            </div>
            <span />
          </div>

          <div style={GRID_ROW}>
            <label style={LABEL_STYLE}>Disconteringsvoet scenarioperiode</label>
            <div
              className="fin-input-wrap"
              style={{ background: 'var(--line-soft)' }}
            >
              <input
                readOnly
                style={READONLY_INPUT}
                tabIndex={-1}
                value={formatDcfPct2(computeResult.kostenvoet)}
              />
            </div>
            <div style={DEC_STYLE}>{formatDcfDec4(computeResult.kostenvoet)}</div>
          </div>

          <div style={GRID_ROW}>
            <label style={LABEL_STYLE}>Vermogensvoet rest periode</label>
            <div style={GREEN_BOX}>
              <input
                className="dcf-new-input"
                max={DCF_VERMOGENSVOET_REST_PCT_RANGE.max}
                min={DCF_VERMOGENSVOET_REST_PCT_RANGE.min}
                onChange={event =>
                  setUitgangspunt({
                    vermogensvoetRest:
                      Number(event.target.value) / PERCENT_DIVISOR,
                  })
                }
                step={DCF_VERMOGENSVOET_REST_PCT_RANGE.step}
                type="range"
                value={vermogensvoetPct}
              />
              <div style={SLIDER_EDGE}>
                <span>laag ({DCF_VERMOGENSVOET_REST_PCT_RANGE.min}%)</span>
                <span style={SLIDER_VALUE}>
                  {formatDcfPct2(uitgangspunten.vermogensvoetRest)}
                </span>
                <span>hoog ({DCF_VERMOGENSVOET_REST_PCT_RANGE.max}%)</span>
              </div>
            </div>
            <div style={DEC_STYLE}>
              {formatDcfDec4(uitgangspunten.vermogensvoetRest)}
            </div>
          </div>

          <div style={GRID_ROW}>
            <label style={LABEL_WITH_TIP}>
              <span>Levenscyclus van de onderneming</span>
              <InfoTip
                label="Toelichting Levenscyclus van de onderneming"
                tip="Door de levenscyclus van de onderneming te kiezen, bepalen we het groeipercentage in de restperiode aan de hand van gestandaardiseerde waarden."
              />
            </label>
            <div className="fin-input-wrap" style={SELECT_WRAP}>
              <select
                onChange={event =>
                  setUitgangspunt({ groeiRest: Number(event.target.value) })
                }
                style={SELECT_STYLE}
                value={selectedGroeiRest}
              >
                {DCF_GROEIREST_OPTIONS.map(option => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={DEC_STYLE}>
              {formatDcfDec4(1 + uitgangspunten.groeiRest)}
            </div>
          </div>

          <div style={GRID_ROW}>
            <label style={LABEL_WITH_TIP}>
              <span>Restwaarde beperken</span>
              <InfoTip
                label="Toelichting Restwaarde beperken"
                tip="Als deze functie aan staat, controleren we of de restwaarde nooit meer is dan 0,75x de waarde van alle scenariojaren bij elkaar opgeteld"
              />
            </label>
            <div
              style={{
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'flex-start',
              }}
            >
              <label className="toggle-switch" style={{ margin: 0 }}>
                <input
                  checked={uitgangspunten.restwaardeCap !== false}
                  onChange={event =>
                    setUitgangspunt({ restwaardeCap: event.target.checked })
                  }
                  type="checkbox"
                />
                <span className="toggle-track" />
              </label>
            </div>
            <span />
          </div>
        </div>

        <SectionActions
          isSaving={isSaving}
          onReset={resetUitgangspunten}
          onSave={() => void persist('Uitgangspunten')}
        />
      </div>

      <div className="card mb-5">
        <h3 className="form-section-title" style={{ marginTop: 0 }}>
          WACC
        </h3>

        <div style={{ marginTop: '14px', overflowX: 'auto' }}>
          <table
            className="dcfn-wacc-table"
            style={{ borderCollapse: 'collapse', width: '100%' }}
          >
            <colgroup>
              <col style={{ width: '32%' }} />
              <col style={{ minWidth: '90px', width: '26%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '15%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td colSpan={5} style={SECTION_HEADER_TD}>
                  Disconto Berekening
                </td>
              </tr>
              {(
                [
                  { label: 'Risk free rate', value: resolvedInputs.rfr },
                  { label: 'Market risk premium', value: resolvedInputs.mrp },
                  {
                    label: 'Sectorcorrectie',
                    value: resolvedInputs.sectoropslag,
                  },
                  { label: 'Illiquiditeitspremie', value: resolvedInputs.ip },
                ] as const
              ).map(row => (
                <tr key={row.label}>
                  <td colSpan={4} style={LABEL_TD}>
                    <span
                      style={{
                        alignItems: 'center',
                        display: 'inline-flex',
                        gap: '6px',
                      }}
                    >
                      {row.label}{' '}
                      <InfoTip label="Marktconforme parameter" tip={MARKT_TIP} />
                    </span>
                  </td>
                  <td style={PILL_TD}>
                    <span style={DERIVED_PILL}>{formatDcfNum3(row.value)}</span>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={4} style={TOTAL_LABEL_TD}>
                  Totaal
                </td>
                <td style={TOTAL_PILL_TD}>
                  <span style={DERIVED_PILL_BOLD}>
                    {formatDcfNum3(computeResult.subtotaal1)}
                  </span>
                </td>
              </tr>
              <tr>
                <td colSpan={5} style={{ height: '14px' }} />
              </tr>

              <tr>
                <td colSpan={5} style={SECTION_HEADER_TD}>
                  Kwetsbaarheid onderneming
                </td>
              </tr>
              {DCF_KLEIN_FIELDS.map(field => (
                <tr key={field.key}>
                  <td style={LABEL_TD}>{field.label}</td>
                  <td style={SLIDER_TD}>
                    {renderScaleSlider(
                      dcfInputs.klein[field.key].waarde,
                      DCF_KLEIN_RANGE,
                      next => setKleinWaarde(field.key, next),
                    )}
                  </td>
                  <td style={NUM_TD}>
                    {formatDcfPct2(dcfInputs.klein[field.key].midPct)}
                  </td>
                  <td />
                  <td style={PILL_TD}>
                    <span style={DERIVED_PILL}>
                      {formatDcfNum3(computeResult.klein[field.key])}
                    </span>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={4} style={TOTAL_LABEL_TD}>
                  Totaal
                </td>
                <td style={TOTAL_PILL_TD}>
                  <span style={DERIVED_PILL_BOLD}>
                    {formatDcfNum3(computeResult.kleinPremie)}
                  </span>
                </td>
              </tr>
              <tr>
                <td colSpan={5} style={{ height: '14px' }} />
              </tr>

              <tr>
                <td colSpan={5} style={SECTION_HEADER_TD}>
                  Risicoprofiel markt
                </td>
              </tr>
              {DCF_ASSET_FIELDS.map(field => (
                <tr key={field.key}>
                  <td style={LABEL_TD}>{field.label}</td>
                  <td style={SLIDER_TD}>
                    {renderScaleSlider(
                      dcfInputs.asset[field.key].waarde,
                      DCF_ASSET_RANGE,
                      next => setAssetWaarde(field.key, next),
                    )}
                  </td>
                  <td style={NUM_TD}>
                    {formatDcfPct2(dcfInputs.asset[field.key].midPct)}
                  </td>
                  <td />
                  <td style={PILL_TD}>
                    <span style={DERIVED_PILL}>
                      {formatDcfNum3(computeResult.asset[field.key])}
                    </span>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={4} style={TOTAL_LABEL_TD}>
                  Totaal
                </td>
                <td style={TOTAL_PILL_TD}>
                  <span style={DERIVED_PILL_BOLD}>
                    {formatDcfNum3(computeResult.alfa)}
                  </span>
                </td>
              </tr>

              <tr>
                <td colSpan={4} style={KOSTENVOET_LABEL_TD}>
                  Kostenvoet unlevered
                </td>
                <td style={KOSTENVOET_PILL_TD}>
                  <span style={TOTAL_PILL}>
                    {formatDcfNum3(computeResult.kostenvoet)}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '16px' }}>
          <button
            onClick={() => setIsDiscOpen(open => !open)}
            style={{
              alignItems: 'center',
              background: 'var(--line-soft)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              color: 'var(--ink)',
              cursor: 'pointer',
              display: 'inline-flex',
              fontFamily: 'inherit',
              fontSize: '14px',
              fontWeight: 500,
              gap: '8px',
              padding: '10px 16px',
              userSelect: 'none',
            }}
            type="button"
          >
            <svg
              fill="none"
              height="14"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                flexShrink: 0,
                transform: isDiscOpen ? 'rotate(90deg)' : 'rotate(0)',
                transition: 'transform .2s',
              }}
              viewBox="0 0 24 24"
              width="14"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            Discontovoet per jaar van de scenarioperiode
          </button>

          {isDiscOpen && (
            <div
              style={{
                background: '#fafbfa',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius)',
                marginTop: '14px',
                padding: '14px',
              }}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <colgroup>
                    <col style={{ width: '50%' }} />
                    <col style={{ width: '50%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th
                        style={{
                          background: 'var(--line-soft)',
                          borderBottom: '1px solid var(--line)',
                          color: 'var(--muted)',
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '8px 12px',
                          textAlign: 'left',
                        }}
                      >
                        Jaar
                      </th>
                      <th
                        style={{
                          background: 'var(--line-soft)',
                          borderBottom: '1px solid var(--line)',
                          color: 'var(--muted)',
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '8px 12px',
                          textAlign: 'right',
                        }}
                      >
                        Disconteringsvoet
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {computeResult.discRows.map(row => (
                      <tr
                        key={row.year}
                        style={{ borderBottom: '1px solid var(--line-soft)' }}
                      >
                        <td
                          style={{
                            color: 'var(--muted)',
                            fontSize: '13.5px',
                            padding: '7px 12px',
                          }}
                        >
                          {row.year}
                        </td>
                        <td
                          style={{
                            color: 'var(--ink)',
                            fontSize: '13px',
                            fontVariantNumeric: 'tabular-nums',
                            padding: '7px 12px',
                            textAlign: 'right',
                          }}
                        >
                          {formatDcfNum3(row.df)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <SectionActions
          isSaving={isSaving}
          onReset={resetWacc}
          onSave={() => void persist('WACC-aannames')}
        />
      </div>
    </>
  )
}
