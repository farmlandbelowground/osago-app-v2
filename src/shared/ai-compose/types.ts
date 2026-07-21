export type AiComposeAction = 'generate' | 'rewrite'

export type AiComposeLength = 'short' | 'normal' | 'long'

// Ports the AI_PATTERN_CATALOG keys (osago-bundle.js:16006-16046). Slice 7
// carried only the two report patterns; Slice 9 adds the remaining six the
// presentation builder's field→pattern map resolves to (spec §3.8).
export type AiPatternKey =
  | 'personal-narrative'
  | 'highlight'
  | 'swot-item'
  | 'swot-synthesis'
  | 'descriptive-medium'
  | 'descriptive-long'
  | 'compact-fact'
  | 'process-listing'

export interface AiPatternCatalogEntry {
  role: string
  style: string
  maxTokensCap?: number
  maxTokensFloor?: number
}

export interface AiLengthOption {
  label: string
  length: AiComposeLength
  meta: string
}

export interface AiLengthSpec {
  desc: string
  maxTokens: number
}

export interface ContextBucket {
  label: string
  max: number
}

export interface ContextItem {
  label: string
  value: string
}
