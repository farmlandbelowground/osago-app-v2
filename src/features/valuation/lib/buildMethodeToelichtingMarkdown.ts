import { formatGammaInt } from '@shared/gamma'

import {
  type IndicativeEnterpriseValueResult,
  type Normalization,
} from '../types'

// The DCF assumptions the DCF branch reports (already resolved v2 values).
export interface MethodeToelichtingDcf {
  groeiRest: number
  kostenvoet: number
  scenarioStartYear: number
  scenarioYearCount: number
  vermogensvoetRest: number
}

export interface MethodeToelichtingInput {
  dcfApplyEnabled: boolean
  indicative: IndicativeEnterpriseValueResult
  normalizations: Normalization[]
  sector: string
  dcf?: MethodeToelichtingDcf | null
}

const PERCENT_SCALE = 100

const fmtMult = (n: number | null | undefined): string =>
  n === null || n === undefined || isNaN(n)
    ? '—'
    : n.toFixed(2).replace('.', ',') + '×'

const fmtEuro = (n: number | null | undefined): string =>
  n === null || n === undefined || isNaN(n) ? '—' : `€ ${formatGammaInt(n)}`

const fmtPct = (v: number | null | undefined): string =>
  typeof v === 'number' && isFinite(v)
    ? (v * PERCENT_SCALE).toFixed(2).replace('.', ',') + '%'
    : '—'

// Joins ['a','b','c'] → 'a, b en c' (Dutch enumeration).
const joinNl = (items: string[]): string => {
  if (items.length === 0) {
    return '—'
  }
  if (items.length === 1) {
    return items[0]
  }
  return items.slice(0, -1).join(', ') + ' en ' + items[items.length - 1]
}

// The DCF-methodiek explanation. Ports renderMethodeToelichtingDcf
// (osago-bundle.js:15101). Table rows become "label: value" lines (matching the
// legacy htmlToPlainMarkdown conversion of the HTML table).
const buildDcfMarkdown = (
  dcf: MethodeToelichtingDcf | null | undefined,
): string => {
  if (!dcf) {
    return 'De DCF-aannames zijn nog niet beschikbaar. Open eerst het DCF-paneel om defaults te laden.'
  }
  const endYear = dcf.scenarioStartYear + dcf.scenarioYearCount - 1
  const restStart = dcf.scenarioStartYear + dcf.scenarioYearCount
  return [
    `We hanteren een samengestelde kostenvoet van **${fmtPct(dcf.kostenvoet)}**.`,
    'Daarnaast hanteren we de volgende uitgangspunten:',
    `Aantal scenariojaren: ${dcf.scenarioYearCount} jaar`,
    `Scenarioperiode: ${dcf.scenarioStartYear} - ${endYear}`,
    `Restperiode: vanaf ${restStart}`,
    `Disconteringsvoet scenarioperiode: ${fmtPct(dcf.kostenvoet)}`,
    `Vermogensvoet rest periode: ${fmtPct(dcf.vermogensvoetRest)}`,
    `Groeipercentage restperiode: ${fmtPct(dcf.groeiRest)}`,
  ].join('\n')
}

// The Methode toelichting as plain markdown, mirroring the on-screen card
// (osago-bundle.js renderMethodeToelichting :15174). Sector-multiple methodiek by
// default; the DCF variant when "Pas DCF-waardering toe" is on. This is the one
// genuinely new derivation (spec §9.2) — v2 renders this only as a React card.
export const buildMethodeToelichtingMarkdown = (
  input: MethodeToelichtingInput,
): string => {
  if (input.dcfApplyEnabled) {
    return buildDcfMarkdown(input.dcf)
  }

  const r = input.indicative
  if (!r || r.value === null) {
    return r?.error ?? 'De waardebepaling kon niet worden uitgevoerd.'
  }

  const paragraphs: string[] = []

  // Sentence 1 — multiple (manual, or sector multiple + optional correction).
  if (r.manualMultipleUsed) {
    paragraphs.push(
      `De gebruikte multiple is **${fmtMult(r.manualMultipleUsed)}**.`,
    )
  } else {
    const sectorName = input.sector || 'jouw sector'
    let sentence = `De sector multiple voor **${sectorName}** is **${fmtMult(r.sectorMultipleRaw)}**.`
    if (r.smallEbitdaApplied || r.smallOrgApplied) {
      sentence += ` Op basis van jouw organisatie en EBITDA hebben we deze sector multiple moeten corrigeren naar **${fmtMult(r.sectorMultipleAdjusted)}**.`
    }
    paragraphs.push(sentence)
  }

  // Sentence 2 — EBITDA years + weighted-average description.
  const yearsList = (r.ebitdaPerYear || []).map(point => point.year)
  const yearsText = joinNl(yearsList.map(String))
  let ebitdaSentence = `We hebben de waardering tot stand gebracht op basis van jouw EBITDA van ${yearsList.length === 1 ? 'het jaar' : 'de jaren'} **${yearsText}**`
  if (
    (r.ebitdaSource === 'weighted' || r.ebitdaSource === 'forecast') &&
    yearsList.length > 1
  ) {
    const weightsText = joinNl(
      (r.ebitdaPerYear || []).map(
        point => `${point.year} (weging ${point.weight})`,
      ),
    )
    ebitdaSentence += `. Hiervan is een gewogen gemiddelde berekend op basis van ${weightsText}, wat resulteert in een EBITDA van **${fmtEuro(r.ebitdaUsed)}**`
  } else if (r.ebitdaSource === 'lastYear') {
    ebitdaSentence += `. De gebruikte EBITDA is **${fmtEuro(r.ebitdaUsed)}**`
  }
  ebitdaSentence += '.'
  paragraphs.push(ebitdaSentence)

  // Sentence 3 — normalizations that actually applied to the used years.
  const usedYears = (r.ebitdaPerYear || []).map(point => point.year)
  const activeNormalizations = input.normalizations.filter(n => {
    if (!n || typeof n.amount !== 'number' || n.amount === 0) {
      return false
    }
    if (!Array.isArray(n.years)) {
      return true
    }
    return usedYears.some(year => n.years?.includes(year))
  })
  if (activeNormalizations.length > 0) {
    let weightedNormSum = 0
    let totalWeight = 0
    for (const point of r.ebitdaPerYear || []) {
      const norm = r.normalizationsPerYear?.[point.year] ?? 0
      const weight = point.weight || 1
      weightedNormSum += norm * weight
      totalWeight += weight
    }
    const effectiveNorm =
      totalWeight > 0 ? Math.round(weightedNormSum / totalWeight) : 0
    const sign = effectiveNorm >= 0 ? 'verhoging' : 'verlaging'
    const namesText = joinNl(
      activeNormalizations.map(n => n.name || '(naamloos)'),
    )
    let normSentence = `Hierop ${activeNormalizations.length === 1 ? 'is een normalisering' : 'zijn normaliseringen'} toegepast (${namesText})`
    if (effectiveNorm !== 0) {
      normSentence += `, met een gemiddelde ${sign} per jaar van **${fmtEuro(Math.abs(effectiveNorm))}**`
    }
    normSentence += '.'
    paragraphs.push(normSentence)
  }

  return paragraphs.join('\n\n')
}
