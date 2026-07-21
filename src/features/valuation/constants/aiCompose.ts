import { type AiPatternKey } from '@shared/ai-compose'

import { type ValuationReportField } from '../types'

// The report field → AI pattern map (osago-bundle.js:16051-16054). The catalog
// itself, the length/model constants, and the compose plumbing now live in
// @shared/ai-compose (Slice 9 promotion, spec §3.8); this feature keeps only its
// own field→pattern lookup.
export const AI_FIELD_PATTERNS: Record<ValuationReportField, AiPatternKey> = {
  foreword: 'personal-narrative',
  closing: 'personal-narrative',
  financialsNote: 'descriptive-long',
  valueDriversNote: 'descriptive-long',
}
