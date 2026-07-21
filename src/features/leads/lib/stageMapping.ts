import {
  FIT_BADGE_BLUE_MIN,
  FIT_BADGE_GREEN_MIN,
  LEAD_STAGES,
} from '../constants/stages'
import { type LeadStage } from '../types'

// DB enum → display label; unknown/null falls back to the first column's label
// (osago-bundle.js:21524-21527 groups unknown stages into 'Nieuw').
export const stageLabel = (stage: LeadStage | null): string =>
  LEAD_STAGES.find(definition => definition.id === stage)?.label ??
  LEAD_STAGES[0].label

// A pipeline lead's board column — unknown/legacy stages fall into the first
// column (osago-bundle.js:21525-21526).
export const resolveBoardStage = (stage: LeadStage | null): LeadStage =>
  LEAD_STAGES.some(definition => definition.id === stage)
    ? (stage as LeadStage)
    : LEAD_STAGES[0].id

// Pipeline-card fit badge colour class (osago-bundle.js:21562).
export const fitBadgeClass = (fitScore: number | null): string => {
  const fit = fitScore ?? 0
  if (fit >= FIT_BADGE_GREEN_MIN) {
    return 'badge-green'
  }
  if (fit >= FIT_BADGE_BLUE_MIN) {
    return 'badge-blue'
  }
  return 'badge-gray'
}
