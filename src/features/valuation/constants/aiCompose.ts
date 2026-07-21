import { type AiComposeLength, type ValuationReportField } from '../types'

// ─── UI: length options shown in the Genereer / Herschrijf dropdowns ───

export interface AiLengthOption {
  label: string
  length: AiComposeLength
  meta: string
}

export const AI_LENGTH_OPTIONS: readonly AiLengthOption[] = [
  { length: 'short', label: 'Kort', meta: '2-3 zinnen' },
  { length: 'normal', label: 'Normaal', meta: '4-6 zinnen' },
  { length: 'long', label: 'Lang', meta: '7-10 zinnen' },
]

export const AI_INSTRUCTION_PLACEHOLDER =
  'Bijv. zakelijker, eenvoudiger, meer focus op groei'

// Generating over an existing textarea with more than this many trimmed
// characters first asks for overwrite confirmation (osago-bundle.js:15946).
export const AI_OVERWRITE_CONFIRM_THRESHOLD = 10

// ─── Prompt assembly: length → guideline + base token budget ───

export interface AiLengthSpec {
  desc: string
  maxTokens: number
}

export const AI_LENGTH_SPEC: Record<AiComposeLength, AiLengthSpec> = {
  short: { desc: 'kort (2-3 zinnen)', maxTokens: 300 },
  normal: { desc: 'normaal (4-6 zinnen)', maxTokens: 600 },
  long: { desc: 'lang (7-10 zinnen)', maxTokens: 1500 },
}

export const AI_MODEL_LONG = 'claude-sonnet-5'
export const AI_MODEL_DEFAULT = 'claude-haiku-4-5-20251001'

// ─── Per-field prompt catalog (osago-bundle.js:16006-16055) ───
// Only the two patterns the four report fields resolve to are ported here;
// the pres-ext patterns belong to Slice 9's presentation builder.

export type AiPatternKey = 'personal-narrative' | 'descriptive-long'

export interface AiPatternCatalogEntry {
  role: string
  style: string
  maxTokensCap?: number
  maxTokensFloor?: number
}

export const AI_PATTERN_CATALOG: Record<AiPatternKey, AiPatternCatalogEntry> = {
  'personal-narrative': {
    role: 'schrijver van een persoonlijk voorwoord/afsluiting namens de ondernemer',
    style:
      'eerste persoon (wij/ik), warm maar zakelijk, verhalend, geen puntenlijst',
    maxTokensFloor: 400,
  },
  'descriptive-long': {
    role: 'zakelijke tekstschrijver van een analytische toelichting in een waarderingsrapport',
    style: 'vijf tot acht zinnen, opbouwend van context naar conclusie',
    maxTokensFloor: 500,
  },
}

export const AI_FIELD_PATTERNS: Record<ValuationReportField, AiPatternKey> = {
  foreword: 'personal-narrative',
  closing: 'personal-narrative',
  financialsNote: 'descriptive-long',
  valueDriversNote: 'descriptive-long',
}

// ─── Anonymized company-context buckets (osago-bundle.js:16257-16281) ───

export const SECTOR_FALLBACK = 'onbekende sector'
export const LEGAL_FORM_FALLBACK = 'onderneming'
export const REVENUE_UNKNOWN_LABEL = 'niet bekend'

export interface ContextBucket {
  label: string
  max: number
}

export const REVENUE_BUCKETS: readonly ContextBucket[] = [
  { max: 1_000_000, label: 'onder €1M' },
  { max: 5_000_000, label: '€1–5M' },
  { max: 10_000_000, label: '€5–10M' },
  { max: 25_000_000, label: '€10–25M' },
  { max: 50_000_000, label: '€25–50M' },
  { max: Number.POSITIVE_INFINITY, label: 'boven €50M' },
]

export const FTE_BUCKETS: readonly ContextBucket[] = [
  { max: 10, label: 'minder dan 10 FTE' },
  { max: 25, label: '10–25 FTE' },
  { max: 50, label: '25–50 FTE' },
  { max: 100, label: '50–100 FTE' },
  { max: Number.POSITIVE_INFINITY, label: 'meer dan 100 FTE' },
]
