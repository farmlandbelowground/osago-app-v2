'use client'

import { useState, type FC } from 'react'

import {
  type FinancialYearInput,
  type FinancialsExtraction,
} from '@features/valuation/types'

import { DcfAssumptionsCard } from '../DcfAssumptionsCard'
import { FinancialsExtractionReviewPanel } from '../FinancialsExtractionReviewPanel'
import { FinancialsExtractionUpload } from '../FinancialsExtractionUpload'
import { FinancialsGrid } from '../FinancialsGrid'
import { type PendingExtractionApply } from '../FinancialsGrid/types'
import { NonLegalEntityCard } from '../NonLegalEntityCard'
import {
  DEFAULT_NON_LEGAL_ENTITY_VALUATION,
  NON_LEGAL_ENTITY_FORMS,
} from '../NonLegalEntityCard/constants'
import { NormalizationsPanel } from '../NormalizationsPanel'
import { ShareholderValueCard } from '../ShareholderValueCard'
import { ValuationSettingsPanel } from '../ValuationSettingsPanel'
import { type Props } from './types'

const matchSectorMultiple = (
  sector: string,
  multiples: Props['valuationMultiples'],
): number | null => {
  const sectorLower = sector.toLowerCase()
  const exact = multiples.find(
    multiple => multiple.label.toLowerCase() === sectorLower,
  )
  if (exact) {
    return exact.value
  }

  const substring = multiples.find(multiple =>
    sectorLower.includes(multiple.label.toLowerCase()),
  )
  return substring?.value ?? null
}

export const FinancialsPageContent: FC<Props> = ({
  autoForecastDefault,
  bedrijfMarktOntwikkeling,
  dcfAdminDefaults,
  dcfNewInputs,
  initialYears,
  lastClosedYear,
  legalForm,
  nonLegalEntityDefault,
  normalizations,
  sector,
  shareholderValue,
  valuationMultiples,
  valuationSettings,
}) => {
  const [currentLastClosedYear, setCurrentLastClosedYear] =
    useState(lastClosedYear)
  const [dcfInputs, setDcfInputs] = useState(dcfNewInputs)
  const [nonLegalEntity, setNonLegalEntity] = useState(
    nonLegalEntityDefault ?? DEFAULT_NON_LEGAL_ENTITY_VALUATION,
  )
  const [pendingExtraction, setPendingExtraction] =
    useState<FinancialsExtraction | null>(null)
  const [extractionApply, setExtractionApply] =
    useState<PendingExtractionApply | null>(null)
  const [skippedYears, setSkippedYears] = useState<number[]>([])

  const displayYears = Array.from(
    { length: 6 },
    (_, index) => currentLastClosedYear - 2 + index,
  )

  const financials: Record<number, FinancialYearInput> = Object.fromEntries(
    initialYears.map(row => [row.year, row]),
  )

  const isNonLegalEntity = NON_LEGAL_ENTITY_FORMS.includes(legalForm)
  const sectorMultiple = matchSectorMultiple(sector, valuationMultiples)

  return (
    <>
      <FinancialsGrid
        autoForecastDefault={autoForecastDefault}
        dcfAdminDefaults={dcfAdminDefaults}
        dcfInputs={dcfInputs}
        extractionApply={extractionApply}
        initialYears={initialYears}
        lastClosedYear={lastClosedYear}
        nonLegalEntity={nonLegalEntity}
        normalizations={normalizations}
        onDcfInputsChange={setDcfInputs}
        onLastClosedYearChange={setCurrentLastClosedYear}
        sectorMultiple={sectorMultiple}
        valuationSettings={valuationSettings}
      />

      {isNonLegalEntity ? (
        <NonLegalEntityCard
          onChange={patch => setNonLegalEntity(prev => ({ ...prev, ...patch }))}
          value={nonLegalEntity}
        />
      ) : (
        <ShareholderValueCard
          financials={financials}
          initialValue={shareholderValue}
          lastClosedYear={currentLastClosedYear}
        />
      )}

      {valuationSettings.dcfApplyEnabled && (
        <DcfAssumptionsCard
          adminDefaults={dcfAdminDefaults}
          bedrijfMarktOntwikkeling={bedrijfMarktOntwikkeling}
          dcfInputs={dcfInputs}
          lastClosedYear={currentLastClosedYear}
          onChange={setDcfInputs}
          sectorMultiple={sectorMultiple}
        />
      )}

      <details className="mt-4" style={{ marginTop: '24px' }}>
        <summary
          style={{
            alignItems: 'center',
            background: 'var(--line-soft)',
            border: '1px solid var(--line)',
            borderRadius: '8px',
            color: 'var(--ink)',
            cursor: 'pointer',
            display: 'inline-flex',
            fontSize: '14px',
            fontWeight: 500,
            gap: '8px',
            listStyle: 'none',
            padding: '10px 16px',
            userSelect: 'none',
          }}
        >
          <svg
            fill="none"
            height="14"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="14"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          Uitgebreide instellingen en opties
        </summary>

        <div style={{ marginTop: '14px' }}>
          <NormalizationsPanel
            applicableYears={displayYears}
            initialNormalizations={normalizations}
          />
        </div>

        <div style={{ marginTop: '18px' }}>
          <ValuationSettingsPanel initialSettings={valuationSettings} />
        </div>

        <div style={{ marginTop: '18px' }}>
          <FinancialsExtractionUpload
            onExtracted={extraction => {
              setPendingExtraction(extraction)
              setSkippedYears([])
            }}
          />

          {pendingExtraction && (
            <div style={{ marginTop: '14px' }}>
              <FinancialsExtractionReviewPanel
                displayYears={displayYears}
                extraction={pendingExtraction}
                onApply={years => {
                  const skipped = pendingExtraction.years
                    .map(row => row.year)
                    .filter(
                      year => !years.some(applied => applied.year === year),
                    )
                  setSkippedYears(skipped)
                  setExtractionApply({ token: Date.now(), years })
                  setPendingExtraction(null)
                }}
                onDismiss={() => setPendingExtraction(null)}
              />
            </div>
          )}

          {skippedYears.length > 0 && (
            <div className="alert alert-info mt-3">
              {`Jaren buiten de huidige tabelweergave zijn overgeslagen: ${skippedYears.join(', ')}.`}
            </div>
          )}
        </div>
      </details>
    </>
  )
}
