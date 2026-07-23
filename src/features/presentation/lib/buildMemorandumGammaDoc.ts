import { type Company } from '@features/company/types'
import {
  buildFinancialsTableMd,
  type GammaValuationData,
} from '@features/valuation'
import {
  formatGammaInt,
  type GammaComponentPlacement,
  type GammaPhotoPlacement,
} from '@shared/gamma'

import {
  type PresentationFieldDef,
  type PresentationFields,
  type PresentationTab,
} from '../types'
import { type GammaDocResult } from './buildTeaserGammaDoc'

export interface MemorandumGammaInput {
  company: Company
  currentYear: number
  fields: PresentationFields
  includeValuation: boolean
  tabs: PresentationTab[]
  valuation: GammaValuationData | null
}

const CONTENT_PHOTO_RECT = { h: 0.72, w: 0.4, x: 0.55, y: 0.14 }
const ADDENDUM_GAUGE_RECT = { h: 0.28, w: 0.88, x: 0.06, y: 0.66 }

const eur = (value: number): string => `€ ${formatGammaInt(value)}`

// Builds the information memorandum from the visible /verkooppresentatie tabs —
// the source of truth for the slides, fields and per-tab photos the customer
// filled in. Hidden tabs are already dropped by the caller. When the
// "Beknopte informatie over de waardebepaling toevoegen" toggle is on, a short
// valuation addendum (2 gauges) is inserted before the vervolg tab. Gamma gets
// only text; the photos go in the reserved right column. Ports
// buildMemorandumGammaDoc (osago-bundle.js #65).
export const buildMemorandumGammaDoc = (
  input: MemorandumGammaInput,
): GammaDocResult => {
  const { company, fields } = input
  const sector = company.sector.trim()
  const plaats = company.city.trim()

  const valOf = (f: PresentationFieldDef): string => {
    const stored = fields[f.key]
    if (stored != null && stored !== '') {
      return String(stored).trim()
    }
    if (f.prefill === 'description') {
      return company.description.trim()
    }
    if (f.prefill === 'usp') {
      return company.usp.trim()
    }
    if (f.prefill === 'reasonForSale') {
      return company.reasonForSale.trim()
    }
    return ''
  }

  const slides: string[] = []
  const photos: GammaPhotoPlacement[] = []
  const components: GammaComponentPlacement[] = []
  const pushSlide = (text: string, tabId: string | null): void => {
    slides.push(text)
    if (tabId) {
      photos.push({
        rect: CONTENT_PHOTO_RECT,
        slide: slides.length,
        source: { tab: tabId },
      })
    }
  }

  // The valuation addendum ("ADDENDUM WAARDERING OSAGO.docx"): Ondernemingswaarde
  // (methode toelichting + financials) and Aandeelhouderwaarde (eindbalans +
  // totstandkoming table) each carry an injected gauge; a Toelichting page
  // follows only when at least one note is filled.
  const buildWaarderingSlides = (): {
    gauge?: GammaComponentPlacement['spec']
    text: string
  }[] => {
    const v = input.valuation
    if (!v || !v.enterpriseValue) {
      return []
    }
    const out: { gauge?: GammaComponentPlacement['spec']; text: string }[] = []
    const ev = v.enterpriseValue
    const sv = v.shareholderValue
    const band = v.band

    // 1. Ondernemingswaarde — method + financials, gauge underneath (text stays
    //    brief: the amount is already in the slider).
    out.push({
      gauge: {
        high: ev + band,
        kind: 'gauge',
        low: ev - band,
        merk: 'osago',
        mid: ev,
        title: 'Indicatieve ondernemingswaarde',
      },
      text: [
        '## Ondernemingswaarde',
        v.methodeMarkdown
          ? '### Methode toelichting\n\n' + v.methodeMarkdown
          : '',
        (() => {
          const t = buildFinancialsTableMd(v.financials, input.currentYear)
          return t ? '### Financiële kengetallen\n\n' + t : ''
        })(),
      ]
        .filter(Boolean)
        .join('\n\n'),
    })

    // 2. Aandeelhouderwaarde — only for a legal form with shares.
    if (v.showAsh) {
      out.push({
        gauge: {
          high: sv + band,
          kind: 'gauge',
          low: sv - band,
          merk: 'osago',
          mid: sv,
          title: 'Indicatieve aandeelhouderswaarde',
        },
        text: [
          '## Aandeelhouderwaarde',
          `Gebaseerd op de eindbalans van ${v.lastClosedYear}.`,
          '### Totstandkoming aandeelhouderswaarde',
          [
            '| Post | Bedrag |',
            '| --- | --- |',
            `| Ondernemingswaarde | ${eur(ev)} |`,
            `| Positie werkkapitaal | ${eur(v.ashBreakdown.positieWerkkap)} |`,
            `| Debt & cash free-verrekening | ${eur(v.ashBreakdown.dcfree)} |`,
            `| **Indicatieve aandeelhouderswaarde** | **${eur(sv)}** |`,
          ].join('\n'),
        ].join('\n\n'),
      })
    }

    // 3. Toelichting — only when at least one of the three notes is filled.
    const fN = v.valuationReport.financialsNote.trim()
    const vN = v.valuationReport.valueDriversNote.trim()
    const cN = v.valuationReport.closing.trim()
    if (fN || vN || cN) {
      out.push({
        text: [
          '## Toelichting',
          fN ? '### Toelichting financiële gegevens\n\n' + fN : '',
          vN ? '### Toelichting value drivers\n\n' + vN : '',
          cN ? '### Tot slot\n\n' + cN : '',
        ]
          .filter(Boolean)
          .join('\n\n'),
      })
    }
    return out
  }

  // /mijn-bedrijf fields Maikel's IM template wants on specific chapters but
  // which are not presentation fields. Position 'before'/'after' follows the
  // template order; shown only when filled.
  const companyBlocksFor = (
    tabId: string,
    pos: 'after' | 'before',
  ): string[] => {
    const out: string[] = []
    const add = (label: string, value: unknown): void => {
      const v = String(value == null ? '' : value).trim()
      if (v) {
        out.push(`### ${label}\n\n${v}`)
      }
    }
    if (tabId === 'kernpropositie') {
      if (pos === 'before') {
        add('Korte bedrijfsomschrijving', company.description)
      }
      if (pos === 'after') {
        add('Unique Selling Point (USP)', company.usp)
      }
    } else if (tabId === 'historie' && pos === 'before') {
      if (
        company.employees != null &&
        String(company.employees).trim() !== ''
      ) {
        add('Aantal medewerkers (FTE)', company.employees)
      }
    } else if (tabId === 'website' && pos === 'before') {
      add('Website', company.website)
    } else if (tabId === 'locatie' && pos === 'before') {
      const straat = [
        company.street,
        company.houseNumber,
        company.houseNumberExtra,
      ]
        .map(x => String(x ?? '').trim())
        .filter(Boolean)
        .join(' ')
      const pc = [company.postalCode, company.city]
        .map(x => String(x ?? '').trim())
        .filter(Boolean)
        .join(' ')
      const adres = [straat, pc].filter(Boolean).join('\n')
      if (adres) {
        out.push(`### Locatie\n\n${adres}`)
      }
    }
    return out
  }

  for (const tab of input.tabs) {
    if (tab.id === 'voorblad') {
      pushSlide(
        [
          `# Informatiememorandum — ${company.name || 'Onderneming'}`,
          'VERTROUWELIJK INFORMATIEMEMORANDUM',
          sector ? `**${sector.toUpperCase()}**` : '',
          fields.ext_tagline ? String(fields.ext_tagline).trim() : '',
          plaats ? `Locatie: ${plaats}` : '',
          'Dit document is door de aanbieder zelf opgesteld met behulp van het Osago-platform. De aanbieder voert het verkoopproces te allen tijde zelf en is verantwoordelijk voor de inhoud van dit document.',
          '> Aan dit document kunnen geen rechten worden ontleend. De aanbieder is verantwoordelijk voor de inhoud en voert het verkoopproces zelf.',
        ]
          .filter(Boolean)
          .join('\n\n'),
        'voorblad',
      )
      continue
    }
    // Insert the valuation addendum before the vervolg tab (when toggled on).
    if (tab.id === 'vervolg' && input.includeValuation) {
      for (const w of buildWaarderingSlides()) {
        pushSlide(w.text, null)
        if (w.gauge) {
          components.push({
            rect: ADDENDUM_GAUGE_RECT,
            slide: slides.length,
            spec: w.gauge,
          })
        }
      }
    }
    // Each filled field becomes a `### label` subheading, so the IM chapters
    // mirror the app screens. Empty fields are skipped — no heading without body.
    const blocks: string[] = ['## ' + (tab.sectionTitle || tab.label)]
    blocks.push(...companyBlocksFor(tab.id, 'before'))
    for (const f of tab.fields) {
      const v = valOf(f)
      if (v) {
        blocks.push(`### ${f.label}\n\n${v}`)
      }
    }
    blocks.push(...companyBlocksFor(tab.id, 'after'))
    if (blocks.length > 1 || tab.required) {
      pushSlide(blocks.join('\n\n'), tab.id)
    }
  }

  // Closing disclaimer / colofon (fixed, no photo).
  pushSlide(
    [
      '## Disclaimer en colofon',
      '### Opgesteld door de aanbieder',
      'Dit document is door de aanbieder zelf opgesteld met behulp van het Osago-platform. De aanbieder voert het verkoopproces te allen tijde zelf en is verantwoordelijk voor de inhoud van dit document.',
      '### Positie van het Osago-platform',
      'Osago is geen partij bij, en geen begeleider of adviseur van, de (voorgenomen) transactie en aanvaardt geen aansprakelijkheid voor de inhoud. Aan dit document kunnen geen rechten worden ontleend.',
      '> Aan dit document kunnen geen rechten worden ontleend. De aanbieder is verantwoordelijk voor de inhoud en voert het verkoopproces zelf.',
    ].join('\n\n'),
    null,
  )

  return {
    components,
    inputText: slides.join('\n\n---\n\n'),
    numCards: slides.length,
    photos,
  }
}
