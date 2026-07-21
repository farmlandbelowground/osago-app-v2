import { type FinancialYearInput } from '@features/valuation/types'
import {
  buildGammaSlidePrompt,
  formatGammaInt,
  OSAGO_COLOFON_TEKST,
  type GammaSlide,
  type GammaSlidePromptResult,
} from '@shared/gamma'

import {
  type PresentationFields,
  type PresentationGenerateVariant,
} from '../types'

export interface PresentationGammaValuation {
  equityValue: number | null
  high: number | null
  low: number | null
  mid: number | null
}

export interface PresentationGammaData {
  city: string
  companyName: string
  description: string
  employees: number | null
  fields: PresentationFields
  financials: Record<number, FinancialYearInput>
  founded: number | null
  legalForm: string
  reasonForSale: string
  recurringRevenue: number | null
  sector: string
  usp: string
  valuation: PresentationGammaValuation | null
}

const buildFinancialLines = (
  financials: Record<number, FinancialYearInput>,
): string[] => {
  const lines: string[] = []
  Object.keys(financials)
    .map(Number)
    .filter(year => !isNaN(year))
    .sort((a, b) => a - b)
    .forEach(year => {
      const row = financials[year]
      const parts: string[] = []
      if (row.revenue != null)
        parts.push(`omzet ${formatGammaInt(row.revenue)}`)
      if (row.cogs != null) parts.push(`kostprijs ${formatGammaInt(row.cogs)}`)
      if (row.operatingExpenses != null)
        parts.push(`bedrijfskosten ${formatGammaInt(row.operatingExpenses)}`)
      if (row.depreciation != null)
        parts.push(`afschrijvingen ${formatGammaInt(row.depreciation)}`)
      if (row.interest != null)
        parts.push(`rentelasten ${formatGammaInt(row.interest)}`)
      if (row.taxesPaid != null)
        parts.push(`belastingen ${formatGammaInt(row.taxesPaid)}`)
      if (parts.length) lines.push(`${year}: ${parts.join(', ')}`)
    })
  return lines
}

// Ports buildTeaserSlides (osago-bundle.js:19664-19690): anonymous — no company
// name, exact location or client names in the content.
const buildTeaserSlides = (
  data: PresentationGammaData,
  financialLines: string[],
): GammaSlidePromptResult => {
  const { fields } = data
  const slides: GammaSlide[] = []
  const add = (title: string, content: string | undefined): void => {
    const trimmed = (content ?? '').trim()
    if (trimmed) slides.push({ title, content: trimmed })
  }

  add(
    'Anoniem verkoopprofiel',
    [
      data.sector ? `Sector: ${data.sector}` : '',
      'Beknopt, anoniem profiel om interesse te peilen. Zonder bedrijfsnaam, exacte locatie of klantnamen.',
    ]
      .filter(Boolean)
      .join('\n'),
  )
  add(
    'Kernpropositie',
    fields.productsServices || data.usp || fields.managementSummary,
  )
  add('Markt en positie', fields.market)
  if (financialLines.length) {
    add(
      'Financiële hoofdlijnen',
      'Kerncijfers op hoofdlijnen (in euro, toon als compacte tabel of KPI-blokken):\n' +
        financialLines.join('\n'),
    )
  }
  add('Waarom interessant', fields.growth || data.reasonForSale)
  add(
    'Vervolgstappen en contact',
    'Interesse? Neem rechtstreeks contact op met de aanbieder.\n' +
      'Contactgegevens: [CONTACTGEGEVENS AANBIEDER — vul hier in hoe geïnteresseerden je kunnen bereiken]\n' +
      'Na het tekenen van een geheimhoudingsverklaring (NDA) deelt de aanbieder het volledige informatiememorandum.',
  )
  add('Colofon en disclaimer', OSAGO_COLOFON_TEKST)

  return buildGammaSlidePrompt(
    'ANONIEM VERKOOPPROFIEL (TEASER) — een beknopt, anoniem document om interesse te peilen, opgesteld door de aanbieder zelf via het Osago-platform. GEEN bedrijfsnaam, exacte locatie of klantnamen in de inhoud.',
    slides,
  )
}

// Ports buildOsagoGammaPrompt (osago-bundle.js:19577-19659). Only sections with
// actual content become a slide; numCards = slides.length. The valuation slide
// appears whenever figures exist (OQ-3 — presentationIncludeValuation is stored
// but NOT consulted here, exactly as legacy).
export const buildPresentationGammaPrompt = (
  variant: PresentationGenerateVariant,
  data: PresentationGammaData,
): GammaSlidePromptResult => {
  const { fields } = data
  const financialLines = buildFinancialLines(data.financials)

  if (variant === 'teaser') {
    return buildTeaserSlides(data, financialLines)
  }

  const feiten: string[] = []
  if (data.sector) feiten.push(`Sector: ${data.sector}`)
  if (data.legalForm) feiten.push(`Rechtsvorm: ${data.legalForm}`)
  if (data.city) feiten.push(`Vestigingsplaats: ${data.city}`)
  if (data.founded) feiten.push(`Opgericht: ${data.founded}`)
  if (data.employees) feiten.push(`Aantal medewerkers: ${data.employees}`)
  if (data.recurringRevenue)
    feiten.push(`Terugkerende omzet: ${data.recurringRevenue}%`)

  const valuationLines: string[] = []
  const valuation = data.valuation
  if (
    valuation &&
    (valuation.low || valuation.mid || valuation.high || valuation.equityValue)
  ) {
    if (valuation.low && valuation.high) {
      valuationLines.push(
        `Indicatieve waardebandbreedte: ${formatGammaInt(valuation.low)} – ${formatGammaInt(valuation.high)} euro`,
      )
    }
    if (valuation.mid) {
      valuationLines.push(
        `Centrale waarde-indicatie: ${formatGammaInt(valuation.mid)} euro`,
      )
    }
    if (valuation.equityValue) {
      valuationLines.push(
        `Indicatieve aandeelhouderswaarde: ${formatGammaInt(valuation.equityValue)} euro`,
      )
    }
  }

  const swot: Array<[string, string | undefined]> = [
    ['Sterktes', fields.swotStrengths],
    ['Zwaktes', fields.swotWeaknesses],
    ['Kansen', fields.swotOpportunities],
    ['Bedreigingen', fields.swotThreats],
  ]
  const swotFilled = swot.filter(([, value]) => value && value.trim())

  const slides: GammaSlide[] = []
  const add = (title: string, content: string | undefined): void => {
    const trimmed = (content ?? '').trim()
    if (trimmed) slides.push({ title, content: trimmed })
  }

  add(
    `Informatiememorandum — ${data.companyName || 'Onderneming'}`,
    [
      data.sector ? `Sector: ${data.sector}` : '',
      'Vertrouwelijk verkoopdocument, opgesteld door de aanbieder.',
    ]
      .filter(Boolean)
      .join('\n'),
  )
  add('Managementsamenvatting', fields.managementSummary)
  add(
    'Bedrijfsprofiel en historie',
    [
      (fields.companyProfile || data.description || '').trim(),
      feiten.length ? 'Kerngegevens:\n' + feiten.join('\n') : '',
    ]
      .filter(Boolean)
      .join('\n\n'),
  )
  add(
    'Producten, diensten en kernpropositie',
    fields.productsServices || data.usp,
  )
  add('Markt en concurrentiepositie', fields.market)
  add('Organisatie en medewerkers', fields.organisation)
  if (financialLines.length) {
    add(
      'Financiële kerncijfers',
      'Meerjaren-overzicht (in euro, toon als nette tabel):\n' +
        financialLines.join('\n'),
    )
  }
  add('Groeikansen', fields.growth)
  if (valuationLines.length) {
    add('Indicatieve waardering', valuationLines.join('\n'))
  }
  add('Reden van verkoop en transactierationale', data.reasonForSale)
  if (swotFilled.length) {
    add(
      'SWOT-analyse',
      'Toon als 2x2-grid:\n' +
        swotFilled
          .map(([key, value]) => `${key}: ${(value ?? '').trim()}`)
          .join('\n'),
    )
  }
  add(
    'Vervolgproces en contact',
    'Geïnteresseerde partijen kunnen rechtstreeks contact opnemen met de aanbieder.\n' +
      'Contactgegevens: [CONTACTGEGEVENS AANBIEDER — vul hier je naam, e-mailadres en telefoonnummer in]\n' +
      'Vervolgstappen: kennismaking, tekenen geheimhoudingsverklaring (NDA), verdiepende informatie en onderhandeling — rechtstreeks met de aanbieder.',
  )
  add('Colofon en disclaimer', OSAGO_COLOFON_TEKST)

  return buildGammaSlidePrompt(
    'INFORMATIEMEMORANDUM (IM) — een volledig, vertrouwelijk verkoopdocument voor potentiële kopers, opgesteld door de aanbieder zelf via het Osago-platform.',
    slides,
  )
}
