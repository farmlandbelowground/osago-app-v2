import { type FinancialYearInput } from '@features/valuation/types'
import {
  formatGammaInt,
  type GammaComponentPlacement,
  type GammaPhotoPlacement,
} from '@shared/gamma'

import { type PresentationFields } from '../types'

export interface TeaserGammaInput {
  city: string
  companyDescription: string
  contact: { email: string; name: string; phone: string }
  currentYear: number
  fields: PresentationFields
  financials: Record<number, FinancialYearInput>
  reasonForSale: string
  sector: string
}

// Result shared by the fixed-template builders: the markdown `inputText` (one
// `---`-separated block per card), the card count, and the injection plans.
export interface GammaDocResult {
  components: GammaComponentPlacement[]
  inputText: string
  numCards: number
  photos: GammaPhotoPlacement[]
}

// Last N closed years shown in the teaser financials block.
const TEASER_FINANCIAL_YEARS = 2

const euro = (value: number): string => `€ ${formatGammaInt(value)}`

// Builds the fixed 4-slide "Anoniem verkoopprofiel" (teaser). Red template text
// is literal; green fields come from the presentation fields / company / account.
// Slides are `---`-separated (cardSplit: inputTextBreaks); Gamma gets ONLY text —
// the photos are injected afterwards into the reserved right column (photos plan
// per slide). Ports buildTeaserGammaDoc (osago-bundle.js #65).
export const buildTeaserGammaDoc = (
  input: TeaserGammaInput,
): GammaDocResult => {
  const { fields } = input
  const sector = input.sector.trim()
  const plaats = input.city.trim()

  // Financial figures — last 2 'real' years (before this calendar year, so no
  // forecast). EBITDA = revenue − cogs − operating expenses (as the app).
  const finRows = Object.keys(input.financials)
    .map(year => parseInt(year, 10))
    .filter(year => !isNaN(year) && year < input.currentYear)
    .sort((a, b) => a - b)
    .slice(-TEASER_FINANCIAL_YEARS)
    .map(year => {
      const f = input.financials[year]
      const rev = Number(f.revenue) || 0
      const ebitda =
        rev - (Number(f.cogs) || 0) - (Number(f.operatingExpenses) || 0)
      return { ebitda, rev, year }
    })

  const slides: string[] = []

  // SLIDE 1 — Anoniem verkoopprofiel <sector>
  slides.push(
    [
      `# Anoniem verkoopprofiel${sector ? ' — ' + sector : ''}`,
      sector ? `**${sector.toUpperCase()}**` : '',
      fields.ext_tagline ? String(fields.ext_tagline).trim() : '',
      plaats ? `Locatie: ${plaats}` : '',
      'Dit document is door de aanbieder zelf opgesteld met behulp van het Osago-platform. De aanbieder voert het verkoopproces te allen tijde zelf en is verantwoordelijk voor de inhoud van dit document.',
      '> Aan dit document kunnen geen rechten worden ontleend. De aanbieder is verantwoordelijk voor de inhoud en voert het verkoopproces zelf.',
    ]
      .filter(Boolean)
      .join('\n\n'),
  )

  // SLIDES 2-4 carry no page title per the template: the sections are `###`
  // subheadings — a `##` would make Gamma turn it into a slide title.

  // SLIDE 2 — Aanbod + Reden van verkoop
  const aanbod = (
    fields.companyProfile ||
    input.companyDescription ||
    ''
  ).trim()
  const redenVerkoop = input.reasonForSale.trim()
  slides.push(
    [
      aanbod ? '### Aanbod\n\n' + aanbod : '',
      redenVerkoop ? '### Reden van verkoop\n\n' + redenVerkoop : '',
    ]
      .filter(Boolean)
      .join('\n\n') || '### Aanbod',
  )

  // SLIDE 3 — Financiële kengetallen + Bijzonderheden + Dealinhoud
  const finBlock = finRows.length
    ? [
        '### Financiële kengetallen',
        '',
        '| Jaar | Omzet | EBITDA |',
        '| --- | --- | --- |',
        ...finRows.map(
          r => `| ${r.year} | ${euro(r.rev)} | ${euro(r.ebitda)} |`,
        ),
      ].join('\n')
    : ''
  slides.push(
    [
      finBlock,
      fields.ext_uniek_waarom
        ? '### Bijzonderheden\n\n' + String(fields.ext_uniek_waarom).trim()
        : '',
      fields.ext_wat_aangeboden
        ? '### Dealinhoud\n\n' + String(fields.ext_wat_aangeboden).trim()
        : '',
      fields.ext_transactievorm
        ? '### Gewenste transactievorm\n\n' +
          String(fields.ext_transactievorm).trim()
        : '',
    ]
      .filter(Boolean)
      .join('\n\n') || '### Financiële kengetallen',
  )

  // SLIDE 4 — Contact + further information + positioning
  slides.push(
    [
      '### Contactpersoon',
      [input.contact.name, input.contact.email, input.contact.phone]
        .filter(Boolean)
        .join('\n') || '[Vul je contactgegevens in]',
      '### Verdere informatie',
      'Het is uiteraard mogelijk om verdere informatie te ontvangen over dit profiel, doch na het sluiten van geheimhouding. Om meer informatie over het profiel te verkrijgen of om een geheimhoudingsverklaring te ontvangen, neem contact op met de bovengenoemde contactpersoon.',
      '### Opgesteld door de aanbieder',
      'Dit document is door de aanbieder zelf opgesteld met behulp van het Osago-platform. De aanbieder voert het verkoopproces te allen tijde zelf en is verantwoordelijk voor de inhoud van dit document.',
      '### Positie van het Osago-platform',
      'Osago is geen partij bij, en geen begeleider of adviseur van, de (voorgenomen) transactie en aanvaardt geen aansprakelijkheid voor de inhoud. Aan dit document kunnen geen rechten worden ontleend.',
      '> Aan dit document kunnen geen rechten worden ontleend. De aanbieder is verantwoordelijk voor de inhoud en voert het verkoopproces zelf.',
    ]
      .filter(Boolean)
      .join('\n\n'),
  )

  // Photo plan: the cover photo fills slide 1; the others sit as a right-side
  // panel so they overlap the text as little as possible.
  const photos: GammaPhotoPlacement[] = [
    {
      rect: { h: 0.8, w: 0.4, x: 0.55, y: 0.1 },
      slide: 1,
      source: { tab: 'voorblad' },
    },
    {
      rect: { h: 0.72, w: 0.4, x: 0.55, y: 0.14 },
      slide: 2,
      source: { tab: 'kernpropositie' },
    },
    {
      rect: { h: 0.72, w: 0.4, x: 0.55, y: 0.14 },
      slide: 3,
      source: { tab: 'historie' },
    },
    {
      rect: { h: 0.34, w: 0.18, x: 0.73, y: 0.12 },
      slide: 4,
      source: { profile: true },
    },
  ]

  return {
    components: [],
    inputText: slides.join('\n\n---\n\n'),
    numCards: slides.length,
    photos,
  }
}
