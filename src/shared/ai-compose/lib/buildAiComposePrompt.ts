import { type Company } from '@features/company/types'

import {
  AI_LENGTH_SPEC,
  AI_MODEL_DEFAULT,
  AI_MODEL_LONG,
  FTE_BUCKETS,
  LEGAL_FORM_FALLBACK,
  REVENUE_BUCKETS,
  REVENUE_UNKNOWN_LABEL,
  SECTOR_FALLBACK,
} from '../constants'
import {
  type AiComposeAction,
  type AiComposeLength,
  type AiPatternCatalogEntry,
  type ContextBucket,
  type ContextItem,
} from '../types'

// Generalized compose-prompt core (spec §3.8 — promoted from valuation's
// buildReportAiPrompt). The doc-type, resolved field title, pattern, and the
// same-fieldset context are supplied by the calling feature; the anonymized
// company buckets + free-text company context are identical across both
// consumers and stay here (ports callAiForField, osago-bundle.js:16162-16220).
export interface BuildAiComposePromptInput {
  action: AiComposeAction
  company: Company
  currentValue: string
  docType: string
  fieldTitle: string
  instruction: string
  length: AiComposeLength
  pattern: AiPatternCatalogEntry
  revenue: number | null
  sameFieldsetContext: ContextItem[]
  sameFieldsetLabel: string
}

export interface BuildAiComposePromptResult {
  maxTokens: number
  model: string
  prompt: string
}

const bucketLabel = (
  value: number,
  buckets: readonly ContextBucket[],
): string => buckets.find(bucket => value < bucket.max)?.label ?? ''

// Free-text Mijn bedrijf context; company name/KvK/address are deliberately
// never sent (osago-bundle.js:16141-16160).
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

export const buildAiComposePrompt = ({
  action,
  company,
  currentValue,
  docType,
  fieldTitle,
  instruction,
  length,
  pattern,
  revenue,
  sameFieldsetContext,
  sameFieldsetLabel,
}: BuildAiComposePromptInput): BuildAiComposePromptResult => {
  const spec = AI_LENGTH_SPEC[length]

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
    `Schrijf tekst voor het veld "${fieldTitle}" van een ${docType}.`,
    `Rol: ${pattern.role}.`,
    `Vorm: ${pattern.style}.`,
    `Lengte-richtlijn: ${spec.desc} — houd je aan de vorm hierboven ook als die kortere of langere output vraagt.`,
    'Toon: professioneel en feitelijk; geen marketing-clichés, geen emoji, geen bedrijfsnamen verzinnen.',
    `Onderneming (geanonimiseerd): ${contextLine}.`,
  ]

  const companyItems = gatherCompanyContext(company)

  if (companyItems.length || sameFieldsetContext.length) {
    const blocks: string[] = []
    if (companyItems.length) {
      blocks.push(
        'Mijn bedrijf:\n' +
          companyItems.map(item => `- ${item.label}: ${item.value}`).join('\n'),
      )
    }
    if (sameFieldsetContext.length) {
      blocks.push(
        `${sameFieldsetLabel}:\n` +
          sameFieldsetContext
            .map(item => `- ${item.label}: ${item.value}`)
            .join('\n'),
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
