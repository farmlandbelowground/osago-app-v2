import {
  type IndicativeEnterpriseValueResult,
  type Normalization,
} from '../types'
import { formatValuationEuro } from './formatValuationEuro'

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

// A run of text that is either plain or emphasised. The card renders emphasis
// as <strong>, the Gamma export as **bold** — one derivation, two renderers.
export interface ToelichtingSegment {
  isStrong: boolean
  text: string
}

export interface ToelichtingRow {
  label: string
  value: string
}

export type MethodeToelichting =
  | { kind: 'message'; text: string }
  | { kind: 'sector'; paragraphs: ToelichtingSegment[][] }
  | {
      kind: 'dcf'
      intro: ToelichtingSegment[]
      lead: string
      rows: ToelichtingRow[]
    }

const PERCENT_SCALE = 100

const NO_DCF_STATE_MESSAGE =
  'De DCF-aannames zijn nog niet beschikbaar. Open eerst het DCF-paneel om defaults te laden.'
const NO_RESULT_MESSAGE = 'De waardebepaling kon niet worden uitgevoerd.'

export const fmtMultiple = (n: number | null | undefined): string =>
  n === null || n === undefined || isNaN(n)
    ? '—'
    : n.toFixed(2).replace('.', ',') + '×'

export const fmtPercent = (v: number | null | undefined): string =>
  typeof v === 'number' && isFinite(v)
    ? (v * PERCENT_SCALE).toFixed(2).replace('.', ',') + '%'
    : '—'

// Joins ['a','b','c'] → 'a, b en c' (Dutch enumeration).
export const joinNl = (items: string[]): string => {
  if (items.length === 0) {
    return '—'
  }
  if (items.length === 1) {
    return items[0]
  }
  return items.slice(0, -1).join(', ') + ' en ' + items[items.length - 1]
}

const plain = (text: string): ToelichtingSegment => ({ isStrong: false, text })
const strong = (text: string): ToelichtingSegment => ({ isStrong: true, text })

// Ports renderMethodeToelichtingDcf (osago-bundle.js:15132-15194).
const buildDcf = (
  dcf: MethodeToelichtingDcf | null | undefined,
): MethodeToelichting => {
  if (!dcf) {
    return { kind: 'message', text: NO_DCF_STATE_MESSAGE }
  }
  const endYear = dcf.scenarioStartYear + dcf.scenarioYearCount - 1
  const restStart = dcf.scenarioStartYear + dcf.scenarioYearCount

  return {
    kind: 'dcf',
    intro: [
      plain('We hanteren een samengestelde kostenvoet van '),
      strong(fmtPercent(dcf.kostenvoet)),
      plain('.'),
    ],
    lead: 'Daarnaast hanteren we de volgende uitgangspunten:',
    rows: [
      { label: 'Aantal scenariojaren', value: `${dcf.scenarioYearCount} jaar` },
      {
        label: 'Scenarioperiode',
        value: `${dcf.scenarioStartYear} - ${endYear}`,
      },
      { label: 'Restperiode', value: `vanaf ${restStart}` },
      {
        label: 'Disconteringsvoet scenarioperiode',
        value: fmtPercent(dcf.kostenvoet),
      },
      {
        label: 'Vermogensvoet rest periode',
        value: fmtPercent(dcf.vermogensvoetRest),
      },
      {
        label: 'Groeipercentage restperiode',
        value: fmtPercent(dcf.groeiRest),
      },
    ],
  }
}

// The structured Methode toelichting. Ports renderMethodeToelichting
// (osago-bundle.js:15205-15327): sector-multiple methodiek by default, the DCF
// variant when "Pas DCF-waardering toe" is on.
export const buildMethodeToelichting = (
  input: MethodeToelichtingInput,
): MethodeToelichting => {
  if (input.dcfApplyEnabled) {
    return buildDcf(input.dcf)
  }

  const r = input.indicative
  if (!r || r.value === null) {
    return { kind: 'message', text: r?.error ?? NO_RESULT_MESSAGE }
  }

  const paragraphs: ToelichtingSegment[][] = []

  // Sentence 1 — multiple (manual, or sector multiple + optional correction).
  if (r.manualMultipleUsed) {
    paragraphs.push([
      plain('De gebruikte multiple is '),
      strong(fmtMultiple(r.manualMultipleUsed)),
      plain('.'),
    ])
  } else {
    const sentence: ToelichtingSegment[] = [
      plain('De sector multiple voor '),
      strong(input.sector || 'jouw sector'),
      plain(' is '),
      strong(fmtMultiple(r.sectorMultipleRaw)),
      plain('.'),
    ]
    if (r.smallEbitdaApplied || r.smallOrgApplied) {
      sentence.push(
        plain(
          ' Op basis van jouw organisatie en EBITDA hebben we deze sector multiple moeten corrigeren naar ',
        ),
        strong(fmtMultiple(r.sectorMultipleAdjusted)),
        plain('.'),
      )
    }
    paragraphs.push(sentence)
  }

  // Sentence 2 — EBITDA years + weighted-average description.
  const yearsList = (r.ebitdaPerYear || []).map(point => point.year)
  const ebitdaSentence: ToelichtingSegment[] = [
    plain(
      `We hebben de waardering tot stand gebracht op basis van jouw EBITDA van ${
        yearsList.length === 1 ? 'het jaar' : 'de jaren'
      } `,
    ),
    strong(joinNl(yearsList.map(String))),
  ]
  if (
    (r.ebitdaSource === 'weighted' || r.ebitdaSource === 'forecast') &&
    yearsList.length > 1
  ) {
    const weightsText = joinNl(
      (r.ebitdaPerYear || []).map(
        point => `${point.year} (weging ${point.weight})`,
      ),
    )
    ebitdaSentence.push(
      plain(
        `. Hiervan is een gewogen gemiddelde berekend op basis van ${weightsText}, wat resulteert in een EBITDA van `,
      ),
      strong(formatValuationEuro(r.ebitdaUsed)),
    )
  } else if (r.ebitdaSource === 'lastYear') {
    ebitdaSentence.push(
      plain('. De gebruikte EBITDA is '),
      strong(formatValuationEuro(r.ebitdaUsed)),
    )
  }
  ebitdaSentence.push(plain('.'))
  paragraphs.push(ebitdaSentence)

  // Sentence 3 — normalizations that actually applied to the used years.
  const activeNormalizations = input.normalizations.filter(n => {
    if (!n || typeof n.amount !== 'number' || n.amount === 0) {
      return false
    }
    if (!Array.isArray(n.years)) {
      return true
    }
    return yearsList.some(year => n.years?.includes(year))
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
    const namesText = joinNl(
      activeNormalizations.map(n => n.name || '(naamloos)'),
    )
    const normSentence: ToelichtingSegment[] = [
      plain(
        `Hierop ${
          activeNormalizations.length === 1
            ? 'is een normalisering'
            : 'zijn normaliseringen'
        } toegepast (${namesText})`,
      ),
    ]
    if (effectiveNorm !== 0) {
      const sign = effectiveNorm >= 0 ? 'verhoging' : 'verlaging'
      normSentence.push(
        plain(`, met een gemiddelde ${sign} per jaar van `),
        strong(formatValuationEuro(Math.abs(effectiveNorm))),
      )
    }
    normSentence.push(plain('.'))
    paragraphs.push(normSentence)
  }

  return { kind: 'sector', paragraphs }
}
