import { type FC, type ReactNode } from 'react'

import { type Props } from './types'

const fmtEuro = (value: number | null | undefined): string =>
  value === null || value === undefined || Number.isNaN(value)
    ? '€ —'
    : `€ ${Number(value).toLocaleString('nl-NL', { maximumFractionDigits: 0 })}`

const fmtMult = (value: number | null | undefined): string =>
  value === null || value === undefined || Number.isNaN(value)
    ? '—'
    : `${Number(value).toFixed(2).replace('.', ',')}×`

const StepRow: FC<{ label: string; value: ReactNode; note?: string }> = ({
  label,
  note,
  value,
}) => (
  <div
    style={{
      alignItems: 'baseline',
      borderBottom: '1px solid var(--line-soft)',
      display: 'grid',
      gap: 14,
      gridTemplateColumns: '1fr auto',
      padding: '10px 0',
    }}
  >
    <div>
      <div style={{ color: 'var(--ink)', fontSize: 13, fontWeight: 500 }}>
        {label}
      </div>
      {note && (
        <div
          style={{
            color: 'var(--muted)',
            fontSize: 11.5,
            lineHeight: 1.4,
            marginTop: 2,
          }}
        >
          {note}
        </div>
      )}
    </div>
    <div
      style={{
        color: 'var(--ink)',
        fontVariantNumeric: 'tabular-nums',
        fontWeight: 500,
        textAlign: 'right',
        whiteSpace: 'nowrap',
      }}
    >
      {value}
    </div>
  </div>
)

const SectionTitle: FC<{ children: ReactNode }> = ({ children }) => (
  <div
    style={{
      color: 'var(--muted)',
      fontSize: 11.5,
      fontWeight: 600,
      letterSpacing: '0.05em',
      margin: '18px 0 6px',
      textTransform: 'uppercase',
    }}
  >
    {children}
  </div>
)

// Ports renderValuationControleCard (osago-bundle.js:15212) — a read-only,
// step-by-step derivation of the indicative EBITDA-multiple enterprise value.
export const ValuationControleCard: FC<Props> = ({ result }) => {
  const isWeighted =
    result.ebitdaSource === 'weighted' || result.ebitdaSource === 'forecast'

  return (
    <div className="card mt-5">
      <h3
        style={{
          alignItems: 'center',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          marginTop: 0,
        }}
      >
        Controle EBITDA-multiple waardering
        <span className="medewerker-badge">Alleen voor medewerkers</span>
      </h3>
      <p className="desc">
        Stap-voor-stap berekening van de indicatieve ondernemingswaarde, zoals
        deze door de slider en het dashboard wordt gebruikt.
      </p>

      <div style={{ marginTop: 18 }}>
        {typeof result.nonLegalEntityAddon === 'number' &&
          result.nonLegalEntityAddon > 0 && (
            <div
              className="alert alert-amber"
              style={{ fontSize: 12.5, marginBottom: 14 }}
            >
              <strong style={{ color: '#92400E' }}>
                Waardering van niet-rechtspersonen actief:
              </strong>{' '}
              de fictieve uur-opslag van{' '}
              <strong>{fmtEuro(result.nonLegalEntityAddon)}</strong>/jaar is bij
              elke jaar-EBITDA opgeteld.
            </div>
          )}

        <SectionTitle>Stap 1 — EBITDA bepalen</SectionTitle>
        {isWeighted ? (
          <>
            {result.ebitdaPerYear.map(point => (
              <StepRow
                key={point.year}
                label={`Jaar ${point.year} — weging ${point.weight}${
                  point.isFuture ? ' (forecast)' : ''
                }`}
                value={fmtEuro(point.ebitda)}
              />
            ))}
            <StepRow
              label="Gewogen gemiddelde EBITDA"
              value={<strong>{fmtEuro(result.ebitdaUsed)}</strong>}
            />
          </>
        ) : (
          <StepRow
            label="Gebruikte EBITDA (laatste gesloten boekjaar)"
            value={<strong>{fmtEuro(result.ebitdaUsed)}</strong>}
          />
        )}

        {result.manualMultipleUsed ? (
          <>
            <SectionTitle>Stap 2 — Handmatig ingegeven multiple</SectionTitle>
            <StepRow
              label="Handmatige EBITDA-multiple"
              note="Ingesteld via Waarderingsinstellingen — sector-multiple en aftrekposten zijn overgeslagen."
              value={<strong>{fmtMult(result.manualMultipleUsed)}</strong>}
            />
          </>
        ) : (
          <>
            <SectionTitle>Stap 2 — Sector-multiple ophalen</SectionTitle>
            <StepRow
              label={`Sector: ${result.sectorLabel ?? '—'}`}
              note="Multiple uit Beheer → Valuation."
              value={<strong>{fmtMult(result.sectorMultipleRaw)}</strong>}
            />
            <SectionTitle>Stap 3 — Aftrekken op de multiple</SectionTitle>
            <StepRow
              label="Aftrek kleine EBITDA"
              value={
                result.smallEbitdaApplied
                  ? `−${fmtMult(result.smallEbitdaApplied.deduction).replace('×', '')}×`
                  : '0,00× (geen match)'
              }
            />
            <StepRow
              label="Aftrek kleine organisatie"
              value={
                result.smallOrgApplied
                  ? `−${fmtMult(result.smallOrgApplied.deduction).replace('×', '')}×`
                  : '0,00× (geen match)'
              }
            />
            <StepRow
              label="Gecorrigeerde sector-multiple"
              value={<strong>{fmtMult(result.sectorMultipleAdjusted)}</strong>}
            />
          </>
        )}

        <SectionTitle>
          {result.manualMultipleUsed ? 'Stap 3' : 'Stap 4'} — Indicatieve
          ondernemingswaarde
        </SectionTitle>
        {result.value !== null ? (
          <div
            style={{
              alignItems: 'baseline',
              background: 'var(--green-soft)',
              border: '1px solid #BBE0CB',
              borderRadius: 8,
              display: 'grid',
              gap: 14,
              gridTemplateColumns: '1fr auto',
              marginTop: 10,
              padding: '14px 12px',
            }}
          >
            <div
              style={{
                color: 'var(--green-dark)',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              Indicatieve ondernemingswaarde
            </div>
            <div
              style={{
                color: 'var(--green-dark)',
                fontSize: 18,
                fontVariantNumeric: 'tabular-nums',
                fontWeight: 700,
                textAlign: 'right',
              }}
            >
              {fmtEuro(result.value)}
            </div>
          </div>
        ) : (
          <div
            style={{
              background: '#FEE2E2',
              borderRadius: 6,
              color: '#991B1B',
              fontSize: 13,
              padding: '10px 12px',
            }}
          >
            Berekening niet voltooid: {result.error ?? 'onbekende fout'}
          </div>
        )}
      </div>
    </div>
  )
}
