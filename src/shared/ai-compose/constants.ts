import {
  type AiLengthOption,
  type AiLengthSpec,
  type AiPatternCatalogEntry,
  type AiPatternKey,
  type AiComposeLength,
  type ContextBucket,
} from './types'

export const ANTHROPIC_MESSAGES_ENDPOINT = '/api/anthropic/v1/messages'

export const AI_COMPOSE_EMPTY_RESULT_ERROR = 'Geen bruikbare respons ontvangen.'

// ─── UI: length options shown in the Genereer / Herschrijf dropdowns ───

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

export const AI_LENGTH_SPEC: Record<AiComposeLength, AiLengthSpec> = {
  short: { desc: 'kort (2-3 zinnen)', maxTokens: 300 },
  normal: { desc: 'normaal (4-6 zinnen)', maxTokens: 600 },
  long: { desc: 'lang (7-10 zinnen)', maxTokens: 1500 },
}

export const AI_MODEL_LONG = 'claude-sonnet-5'
export const AI_MODEL_DEFAULT = 'claude-haiku-4-5-20251001'

// ─── Per-field prompt catalog (osago-bundle.js:16006-16046) — all patterns ───

export const AI_PATTERN_CATALOG: Record<AiPatternKey, AiPatternCatalogEntry> = {
  'personal-narrative': {
    role: 'schrijver van een persoonlijk voorwoord/afsluiting namens de ondernemer',
    style:
      'eerste persoon (wij/ik), warm maar zakelijk, verhalend, geen puntenlijst',
    maxTokensFloor: 400,
  },
  highlight: {
    role: 'schrijver van een korte, pakkende highlight met een concreet cijfer of feit',
    style:
      'één zin, maximaal twee, met een concreet getal of percentage indien mogelijk',
    maxTokensCap: 120,
  },
  'swot-item': {
    role: 'M&A-adviseur die één SWOT-categorie invult',
    style:
      'puntenlijst met 3-5 bullets (gebruik "• " als bullet); één zin per bullet',
    maxTokensCap: 300,
  },
  'swot-synthesis': {
    role: 'M&A-adviseur die de SWOT-analyse vertaalt naar wat het voor een koper betekent',
    style: 'twee tot vier zinnen samenvattend, koper-gericht, geen puntenlijst',
    maxTokensCap: 400,
  },
  'descriptive-medium': {
    role: 'zakelijke tekstschrijver van een verkoopmemorandum-sectie',
    style:
      "twee tot drie compacte alinea's met feitelijke onderbouwing, geen puntenlijst",
  },
  'descriptive-long': {
    role: 'zakelijke tekstschrijver van een analytische toelichting in een waarderingsrapport',
    style: 'vijf tot acht zinnen, opbouwend van context naar conclusie',
    maxTokensFloor: 500,
  },
  'compact-fact': {
    role: 'zakelijke tekstschrijver van een korte, concrete beschrijving',
    style: 'één tot twee compacte zinnen; feitelijk, geen bijzin-constructies',
    maxTokensCap: 200,
  },
  'process-listing': {
    role: 'M&A-adviseur die het vervolgproces stapsgewijs beschrijft',
    style:
      'genummerde lijst (1., 2., 3., ...) van 4-6 stappen; per stap één regel',
    maxTokensCap: 500,
  },
}

export const AI_COMPOSE_FALLBACK_PATTERN: AiPatternKey = 'descriptive-medium'

// ─── Anonymized company-context buckets (osago-bundle.js:16257-16281) ───

export const SECTOR_FALLBACK = 'onbekende sector'
export const LEGAL_FORM_FALLBACK = 'onderneming'
export const REVENUE_UNKNOWN_LABEL = 'niet bekend'

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
