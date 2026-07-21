import { type LeadStage } from '../types'

export interface LeadStageDefinition {
  id: LeadStage
  label: string
}

// The six kanban columns in fixed order with their display labels
// (osago-bundle.js:21514-21521). OQ-5: `interest_confirmed` shows the corrected
// "Interesse bevestigd" (legacy's label was the misspelled "Interesseerde
// bevestigd"). Display-only — the DB enum value is unchanged.
export const LEAD_STAGES: readonly LeadStageDefinition[] = [
  { id: 'new', label: 'Nieuw' },
  { id: 'contact_made', label: 'Contact gelegd' },
  { id: 'interest_confirmed', label: 'Interesse bevestigd' },
  { id: 'negotiation', label: 'In onderhandeling' },
  { id: 'closing', label: 'Deal afwikkelen' },
  { id: 'no_interest', label: 'Geen interesse' },
]

// Moved verbatim from features/dashboard (spec §3.8). Stages counted as an
// active conversation in the dashboard KPI.
export const ACTIVE_CONVERSATION_STAGES: readonly LeadStage[] = [
  'contact_made',
  'interest_confirmed',
  'negotiation',
  'closing',
]

// Document-generation stage gates (osago-bundle.js:21761, 21775).
export const LOI_STAGES: readonly LeadStage[] = ['negotiation', 'closing']
export const CONTRACT_STAGE: LeadStage = 'closing'

// Pipeline-card fit badge thresholds (osago-bundle.js:21562).
export const FIT_BADGE_GREEN_MIN = 85
export const FIT_BADGE_BLUE_MIN = 70

// Fit-score <input> bounds in the pipeline detail modal (osago-bundle.js:21678).
export const FIT_SCORE_MAX = 100

// How long to suppress a card click after a drag-drop (osago-bundle.js:21637).
export const DRAG_CLICK_SUPPRESS_MS = 300
