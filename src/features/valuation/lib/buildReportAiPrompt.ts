import { type Company } from '@features/company/types'
import {
  AI_PATTERN_CATALOG,
  buildAiComposePrompt,
  type AiComposeAction,
  type AiComposeLength,
  type BuildAiComposePromptResult,
  type ContextItem,
} from '@shared/ai-compose'

import { AI_FIELD_PATTERNS } from '../constants/aiCompose'
import { REPORT_SECTIONS } from '../constants/valuationReport'
import {
  type ValuationReportContent,
  type ValuationReportField,
} from '../types'

export interface BuildReportAiPromptInput {
  action: AiComposeAction
  company: Company
  currentValue: string
  field: ValuationReportField
  instruction: string
  length: AiComposeLength
  revenue: number | null
  savedReport: ValuationReportContent
}

const DOC_TYPE = 'waarderingsrapport'
const SAME_FIELDSET_LABEL = 'Andere velden in dit rapport'

const fieldTitle = (field: ValuationReportField): string =>
  REPORT_SECTIONS.find(section => section.field === field)?.title ?? 'tekstveld'

// The other three report fields, filled, feed the same-fieldset context so the
// AI avoids repetition (osago-bundle.js:16110-16121).
const gatherSameFieldsetContext = (
  field: ValuationReportField,
  savedReport: ValuationReportContent,
): ContextItem[] =>
  REPORT_SECTIONS.filter(
    section =>
      section.field !== field && savedReport[section.field].trim() !== '',
  ).map(section => ({
    label: section.title,
    value: savedReport[section.field].trim(),
  }))

export const buildReportAiPrompt = ({
  action,
  company,
  currentValue,
  field,
  instruction,
  length,
  revenue,
  savedReport,
}: BuildReportAiPromptInput): BuildAiComposePromptResult =>
  buildAiComposePrompt({
    action,
    company,
    currentValue,
    docType: DOC_TYPE,
    fieldTitle: fieldTitle(field),
    instruction,
    length,
    pattern: AI_PATTERN_CATALOG[AI_FIELD_PATTERNS[field]],
    revenue,
    sameFieldsetContext: gatherSameFieldsetContext(field, savedReport),
    sameFieldsetLabel: SAME_FIELDSET_LABEL,
  })
