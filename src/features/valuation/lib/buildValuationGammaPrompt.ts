import {
  buildGammaSlidePrompt,
  formatGammaInt,
  OSAGO_COLOFON_TEKST,
  type GammaSlide,
  type GammaSlidePromptResult,
} from '@shared/gamma'

import { type FinancialYearInput, type ValuationReportContent } from '../types'

export interface ValuationReportGammaData {
  companyName: string
  description: string
  employees: number | null
  enterpriseValue: number
  financials: Record<number, FinancialYearInput>
  sector: string
  shareholderValue: number
  usp: string
  valuationBand: number
  valuationReport: ValuationReportContent
}

const eur = (value: number): string => `€ ${formatGammaInt(value)}`

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

// Ports buildValuationGammaPrompt (osago-bundle.js:19831-19908). The computed
// figures are supplied by the caller (getValuationReportGammaInput); this builder
// only assembles the fixed slide structure.
export const buildValuationGammaPrompt = (
  data: ValuationReportGammaData,
): GammaSlidePromptResult => {
  const report = data.valuationReport
  const slides: GammaSlide[] = []
  const add = (title: string, content: string | undefined): void => {
    const trimmed = (content ?? '').trim()
    if (trimmed) slides.push({ title, content: trimmed })
  }

  add(
    `Indicatief waarderingsrapport — ${data.companyName || 'Onderneming'}`,
    [
      data.sector ? `Sector: ${data.sector}` : '',
      'Indicatieve waardering, opgesteld door de aanbieder via het Osago-platform.',
    ]
      .filter(Boolean)
      .join('\n'),
  )
  add('Voorwoord', report.foreword)

  const samenvatting: string[] = []
  if (data.enterpriseValue) {
    samenvatting.push(
      `Indicatieve ondernemingswaarde: ${eur(data.enterpriseValue - data.valuationBand)} – ${eur(data.enterpriseValue + data.valuationBand)} (centrale waarde ${eur(data.enterpriseValue)})`,
    )
  }
  if (data.shareholderValue) {
    samenvatting.push(
      `Indicatieve aandeelhouderswaarde: ${eur(data.shareholderValue - data.valuationBand)} – ${eur(data.shareholderValue + data.valuationBand)} (centrale waarde ${eur(data.shareholderValue)})`,
    )
  }
  if (samenvatting.length) {
    add(
      'Samenvatting van de waardering',
      'Toon als grote KPI-cijfers (indicatief, bandbreedte):\n' +
        samenvatting.join('\n'),
    )
  }

  add(
    'Bedrijfsprofiel',
    [
      data.description.trim(),
      data.usp ? `Onderscheidend vermogen: ${data.usp}` : '',
      data.employees ? `Aantal medewerkers: ${data.employees}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  )
  add(
    'Toegepaste methodiek',
    'De waardering is indicatief en gebaseerd op twee methoden: de Discounted Cash Flow-methodiek (DCF) en de EBITDA-multiple methodiek (sector-multiple × genormaliseerde EBITDA). De getoonde bandbreedte weerspiegelt de onzekerheid die inherent is aan een indicatieve waardering.',
  )

  const financialLines = buildFinancialLines(data.financials)
  if (financialLines.length) {
    add(
      'Financiële onderbouwing',
      [
        'Meerjaren-overzicht (in euro, toon als nette tabel):',
        ...financialLines,
        report.financialsNote.trim(),
      ]
        .filter(Boolean)
        .join('\n'),
    )
  }

  add(
    'Waardebepalende factoren',
    report.valueDriversNote.trim()
      ? report.valueDriversNote.trim()
      : 'Kwalitatieve factoren die de waarde beïnvloeden, zoals klantconcentratie, terugkerende omzet, afhankelijkheid van de eigenaar en groeipotentieel.',
  )
  add('Conclusie', report.closing)
  add(
    'Disclaimer en colofon',
    'Dit is een geautomatiseerde, indicatieve waardering op basis van marktbenchmarks en de door de aanbieder zelf aangeleverde gegevens. ' +
      'De daadwerkelijke verkoopprijs is afhankelijk van due diligence, onderhandeling en marktomstandigheden. ' +
      OSAGO_COLOFON_TEKST,
  )

  return buildGammaSlidePrompt(
    'INDICATIEF WAARDERINGSRAPPORT — objectief, onderbouwend waarderingsdocument, opgesteld door de aanbieder zelf via het Osago-platform.',
    slides,
  )
}
