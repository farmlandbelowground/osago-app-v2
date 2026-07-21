import { type Company } from '@features/company/types'

import {
  AI_FIELD_PATTERNS,
  AI_LENGTH_SPEC,
  AI_MODEL_DEFAULT,
  AI_MODEL_LONG,
  AI_PATTERN_CATALOG,
  FTE_BUCKETS,
  LEGAL_FORM_FALLBACK,
  REVENUE_BUCKETS,
  REVENUE_UNKNOWN_LABEL,
  SECTOR_FALLBACK,
  type ContextBucket,
} from '../constants/aiCompose'
import { REPORT_SECTIONS } from '../constants/valuationReport'
import {
  type AiComposeAction,
  type AiComposeLength,
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

export interface BuildReportAiPromptResult {
  maxTokens: number
  model: string
  prompt: string
}

interface ContextItem {
  label: string
  value: string
}

const DOC_TYPE = 'waarderingsrapport'

const fieldTitle = (field: ValuationReportField): string =>
  REPORT_SECTIONS.find(section => section.field === field)?.title ?? 'tekstveld'

const bucketLabel = (
  value: number,
  buckets: readonly ContextBucket[],
): string => buckets.find(bucket => value < bucket.max)?.label ?? ''

const gatherCompanyContext = (company: Company): ContextItem[] => {
  const items: ContextItem[] = []

  const description = company.description.trim()
  if (description) {
    items.push({ label: 'Bedrijfsomschrijving', value: description })
  }

  const usp = company.usp.trim()
  if (usp) {
    items.push({ label: "USP's / onderscheidend vermogen", value: usp })
  }

  const reason = company.reasonForSale.trim()
  if (reason) {
    items.push({ label: 'Reden voor verkoop / situatie', value: reason })
  }

  if (company.founded) {
    const year = String(company.founded).match(/\d{4}/)
    if (year) {
      items.push({ label: 'Opgericht in', value: year[0] })
    }
  }

  return items
}

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
}: BuildReportAiPromptInput): BuildReportAiPromptResult => {
  const spec = AI_LENGTH_SPEC[length]
  const pattern = AI_PATTERN_CATALOG[AI_FIELD_PATTERNS[field]]

  let maxTokens = spec.maxTokens
  if (pattern.maxTokensCap && maxTokens > pattern.maxTokensCap) {
    maxTokens = pattern.maxTokensCap
  }
  if (pattern.maxTokensFloor && maxTokens < pattern.maxTokensFloor) {
    maxTokens = pattern.maxTokensFloor
  }

  const model = length === 'long' ? AI_MODEL_LONG : AI_MODEL_DEFAULT

  const sector = company.sector || SECTOR_FALLBACK
  const rechtsvorm = company.legalForm || LEGAL_FORM_FALLBACK
  const omzetKlasse =
    revenue && revenue > 0
      ? bucketLabel(revenue, REVENUE_BUCKETS)
      : REVENUE_UNKNOWN_LABEL
  const fteKlasse =
    company.employees && company.employees > 0
      ? bucketLabel(company.employees, FTE_BUCKETS)
      : null

  const contextLine = [
    `sector: ${sector}`,
    `rechtsvorm: ${rechtsvorm}`,
    `omzet-klasse: ${omzetKlasse}`,
    fteKlasse ? `omvang: ${fteKlasse}` : null,
  ]
    .filter(Boolean)
    .join('; ')

  const parts: string[] = [
    'Je bent een ervaren M&A-adviseur die verkoop-documentatie schrijft in het Nederlands.',
    `Schrijf tekst voor het veld "${fieldTitle(field)}" van een ${DOC_TYPE}.`,
    `Rol: ${pattern.role}.`,
    `Vorm: ${pattern.style}.`,
    `Lengte-richtlijn: ${spec.desc} — houd je aan de vorm hierboven ook als die kortere of langere output vraagt.`,
    'Toon: professioneel en feitelijk; geen marketing-clichés, geen emoji, geen bedrijfsnamen verzinnen.',
    `Onderneming (geanonimiseerd): ${contextLine}.`,
  ]

  const companyItems = gatherCompanyContext(company)
  const otherFields = gatherSameFieldsetContext(field, savedReport)

  if (companyItems.length || otherFields.length) {
    const blocks: string[] = []
    if (companyItems.length) {
      blocks.push(
        'Mijn bedrijf:\n' +
          companyItems.map(item => `- ${item.label}: ${item.value}`).join('\n'),
      )
    }
    if (otherFields.length) {
      blocks.push(
        'Andere velden in dit rapport:\n' +
          otherFields.map(item => `- ${item.label}: ${item.value}`).join('\n'),
      )
    }
    parts.push(
      'Reeds ingevulde context (herhaal niet letterlijk; bouw hier logisch op voort):\n\n' +
        blocks.join('\n\n'),
    )
  }

  if (action === 'rewrite') {
    parts.push(`Huidige tekst:\n"""\n${currentValue.trim()}\n"""`)
    parts.push('Schrijf een herschreven versie op basis van deze tekst.')
    if (instruction) {
      parts.push(`Extra instructie van de gebruiker: ${instruction}`)
    }
  }

  parts.push(
    'Geef ALLEEN de tekst terug — geen inleiding, geen citaten, geen markdown, geen labels.',
  )

  return { maxTokens, model, prompt: parts.join('\n\n') }
}
