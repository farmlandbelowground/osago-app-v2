import {
  formatGammaInt,
  type GammaComponentPlacement,
  type GammaPhotoPlacement,
} from '@shared/gamma'

import {
  PAGE_BG_TAKE5,
  TAKE5_CONTACT,
  VAL_BEGRIPPEN_BASE,
  VAL_BEGRIPPEN_DCF,
  VAL_DRIVER_DEFS,
} from '../constants/valuationDoc'
import { type GammaValuationData } from '../queries'
import { buildFinancialsTableMd } from './buildFinancialsTableMd'
import { formatDcfNum3, formatDcfPct2 } from './dcfFormat'

// Value-driver score clamp (0–100%).
const SCORE_MAX = 100

const OW_GAUGE_RECT = { h: 0.34, w: 0.88, x: 0.06, y: 0.6 }
const ASH_GAUGE_RECT = { h: 0.28, w: 0.88, x: 0.06, y: 0.66 }
const VALUE_DRIVERS_RECT = { h: 0.42, w: 0.9, x: 0.05, y: 0.52 }
const REPORT_PHOTO_RECT = { h: 0.38, w: 0.76, x: 0.12, y: 0.56 }

export interface ValuationGammaOpts {
  beknopt: boolean
  merk: 'osago' | 'take5'
}

export interface ValuationDocResult {
  components: GammaComponentPlacement[]
  inputText: string
  numCards: number
  photos: GammaPhotoPlacement[]
  pageBg?: [number, number, number]
}

// Builds the fixed-template valuation report. merk osago/take5, dcf follows the
// "Pas DCF-waardering toe" toggle, beknopt = the short Take 5 variant. Gamma gets
// text/tables; the gauges + value-drivers are injected as components, the report
// hero photo as an overlay. Ports buildValuationGammaDoc (osago-bundle.js #65).
export const buildValuationGammaDoc = (
  data: GammaValuationData,
  opts: ValuationGammaOpts,
  currentYear: number,
): ValuationDocResult => {
  const take5 = opts.merk === 'take5'
  const dcf = data.dcfApplyEnabled
  const beknopt = opts.beknopt
  const naam = data.companyName
  const vr = data.valuationReport
  const eur = (n: number): string => `€ ${formatGammaInt(n)}`

  const ev = data.enterpriseValue
  const sv = data.shareholderValue
  const band = data.band
  const finTableMd = buildFinancialsTableMd(data.financials, currentYear)

  const methodiekFallback = dcf
    ? 'Deze waardering is tot stand gekomen via de Discounted Cash Flow-methodiek (DCF): de verwachte vrije kasstromen over de scenarioperiode en de restperiode zijn contant gemaakt tegen een samengestelde vermogenskostenvoet (WACC).'
    : 'Deze waardering is indicatief en gebaseerd op de EBITDA-multiple methodiek: de genormaliseerde EBITDA vermenigvuldigd met een op de sector gebaseerde multiple, gecorrigeerd voor de omvang van de onderneming.'
  const methodiek = data.methodeMarkdown || methodiekFallback

  const slides: string[] = []
  const components: GammaComponentPlacement[] = []
  const photos: GammaPhotoPlacement[] = []
  const push = (blocks: (string | false)[]): number => {
    slides.push(blocks.filter(Boolean).join('\n\n'))
    return slides.length
  }

  // ── Cover ──────────────────────────────────────────────────────────
  const coverTitle = beknopt
    ? `# Indicatieve waardebepaling — ${naam || 'Onderneming'}`
    : `# Waarderingsrapport — ${naam || 'Onderneming'}`
  const coverDisc = take5
    ? '> BOBB-gecertificeerd. Take 5 heeft dit rapport met zorgvuldigheid samengesteld op basis van de aangeleverde gegevens.'
    : '> Aan dit document kunnen geen rechten worden ontleend. De aanbieder is verantwoordelijk voor de inhoud en voert het verkoopproces zelf.'
  const coverN = push([
    coverTitle,
    data.sector ? `**${data.sector.toUpperCase()}**` : '',
    take5
      ? 'Indicatief waarderingsrapport, opgesteld door Take 5.'
      : 'Indicatieve waardering, opgesteld door de aanbieder via het Osago-platform.',
    coverDisc,
  ])
  photos.push({
    rect: REPORT_PHOTO_RECT,
    slide: coverN,
    source: { tab: 'waarderingsrapport' },
  })

  // ── Voorwoord ──────────────────────────────────────────────────────
  if (!beknopt && vr.foreword.trim()) {
    push(['## Voorwoord', vr.foreword.trim()])
  }

  // ── Financiële gegevens (uitgebreid only) ──────────────────────────
  if (!beknopt && finTableMd) {
    push([
      '## Financiële gegevens',
      'Meerjaren-overzicht (in euro):',
      finTableMd,
      vr.financialsNote.trim()
        ? '### Toelichting financiële gegevens\n\n' + vr.financialsNote.trim()
        : '',
    ])
  }

  // ── Normaliseringen (only when filled) ─────────────────────────────
  if (!beknopt) {
    const norms = data.normalizations.filter(
      n => n && n.name.trim() && Number(n.amount),
    )
    if (norms.length) {
      const jarenTxt = (years: number[] | null): string =>
        Array.isArray(years) && years.length
          ? years
              .slice()
              .sort((a, b) => a - b)
              .join(', ')
          : 'alle jaren'
      push([
        '## Normaliseringen',
        'Correcties op de historische cijfers om eenmalige posten en niet-marktconforme keuzes uit de EBITDA te halen. Een positief bedrag wordt bij de EBITDA opgeteld, een negatief bedrag gaat eraf.',
        [
          '| Normalisering | Bedrag | Van toepassing op |',
          '| --- | --- | --- |',
          ...norms.map(
            n =>
              `| ${n.name.trim()} | ${eur(Number(n.amount))} | ${jarenTxt(n.years)} |`,
          ),
        ].join('\n'),
      ])
    }
  }

  // ── DCF-uitgangspunten + WACC (DCF & uitgebreid only) ──────────────
  if (dcf && !beknopt) {
    const d = data.dcfDetail
    if (d) {
      const startY = d.scenarioStartYear
      const yc = d.scenarioYearCount
      const endY = startY + Math.max(0, yc - 1)
      const restY = startY + yc
      push([
        '## Uitgangspunten DCF-waardering',
        'De DCF-waardering hanteert een scenarioperiode gevolgd door een eeuwigdurende restperiode; de vrije kasstromen worden per jaar contant gemaakt tegen de vermogenskostenvoet.',
        [
          '| Uitgangspunt | Waarde |',
          '| --- | --- |',
          `| Aantal scenariojaren | ${yc} jaar |`,
          `| Scenarioperiode | ${startY} – ${endY} |`,
          `| Restperiode | vanaf ${restY} |`,
          `| Disconteringsvoet scenarioperiode | ${formatDcfPct2(d.kostenvoet)} |`,
          `| Vermogenskostenvoet restperiode | ${formatDcfPct2(d.vermogensvoetRest)} |`,
          `| Groeipercentage restperiode | ${formatDcfPct2(d.groeiRest)} |`,
        ].join('\n'),
      ])
      push([
        '## Bepaling WACC-waarde',
        'De vermogenskostenvoet (WACC) is opgebouwd uit de volgende componenten:',
        [
          '| Component | Waarde |',
          '| --- | --- |',
          `| Risicovrij rendement | ${formatDcfPct2(d.rfr)} |`,
          `| Marktrisicopremie | ${formatDcfPct2(d.mrp)} |`,
          `| Sectorcorrectie | ${formatDcfPct2(d.sectoropslag)} |`,
          `| Illiquiditeitspremie | ${formatDcfPct2(d.ip)} |`,
          `| **Samengestelde vermogenskostenvoet (WACC)** | **${formatDcfPct2(d.kostenvoet)}** |`,
        ].join('\n'),
        d.discRows.length
          ? '### Disconteringsvoet per jaar (scenarioperiode)\n\n' +
            [
              '| Jaar | Disconteringsvoet |',
              '| --- | --- |',
              ...d.discRows.map(r => `| ${r.year} | ${formatDcfNum3(r.df)} |`),
            ].join('\n')
          : '',
      ])
    } else {
      push([
        '## Uitgangspunten DCF-waardering',
        'De DCF-waardering hanteert een scenarioperiode gevolgd door een eeuwigdurende restperiode, contant gemaakt tegen de vermogenskostenvoet.',
      ])
      push([
        '## Bepaling WACC-waarde',
        'De vermogenskostenvoet (WACC) is opgebouwd uit het risicovrije rendement, de marktrisicopremie, een sectorcorrectie en een illiquiditeitspremie.',
      ])
    }
  }

  // ── Ondernemingswaarde (gauge below; text above) ───────────────────
  const owN = push([
    '## Ondernemingswaarde',
    methodiek,
    beknopt && finTableMd ? '### Financiële kengetallen\n\n' + finTableMd : '',
  ])
  components.push({
    rect: OW_GAUGE_RECT,
    slide: owN,
    spec: {
      high: ev + band,
      kind: 'gauge',
      low: ev - band,
      merk: opts.merk,
      mid: ev,
      title: 'Indicatieve ondernemingswaarde',
    },
  })

  // ── Aandeelhouderwaarde (gauge + totstandkoming table) ─────────────
  if (data.showAsh) {
    const totstandkomingMd = [
      '| Post | Bedrag |',
      '| --- | --- |',
      `| Ondernemingswaarde | ${eur(ev)} |`,
      `| Positie werkkapitaal | ${eur(data.ashBreakdown.positieWerkkap)} |`,
      `| Debt & cash free-verrekening | ${eur(data.ashBreakdown.dcfree)} |`,
      `| **Indicatieve aandeelhouderswaarde** | **${eur(sv)}** |`,
    ].join('\n')
    const ashN = push([
      '## Aandeelhouderwaarde',
      `Gebaseerd op de eindbalans van ${data.lastClosedYear}.`,
      '### Totstandkoming aandeelhouderswaarde\n\n' + totstandkomingMd,
    ])
    components.push({
      rect: ASH_GAUGE_RECT,
      slide: ashN,
      spec: {
        high: sv + band,
        kind: 'gauge',
        low: sv - band,
        merk: opts.merk,
        mid: sv,
        title: 'Indicatieve aandeelhouderswaarde',
      },
    })
  }

  // ── Value drivers: definitions (text) + score view (component) ─────
  if (!beknopt) {
    push([
      '## Value drivers',
      'Waardedrijvers zijn factoren die de waarde van een onderneming positief of negatief beïnvloeden. Hieronder de zeven thema’s die in deze waardering zijn meegewogen.',
      VAL_DRIVER_DEFS.map(([t, d]) => `**${t}** — ${d}`).join('\n\n'),
    ])
    if (data.valueDriverScores.length) {
      const vdTableMd = [
        '| Thema | Score |',
        '| --- | --- |',
        ...data.valueDriverScores.map(
          s =>
            `| ${s.title.trim()} | ${Math.max(0, Math.min(SCORE_MAX, Math.round(s.score)))}% |`,
        ),
      ].join('\n')
      const vdScoreN = push([
        '## Value drivers — score per thema',
        'Per thema de score zoals meegewogen in de waardering, op een schaal van 0% (slecht) tot 100% (goed).',
        vdTableMd,
        vr.valueDriversNote.trim()
          ? '### Toelichting value drivers\n\n' + vr.valueDriversNote.trim()
          : '',
      ])
      components.push({
        rect: VALUE_DRIVERS_RECT,
        slide: vdScoreN,
        spec: { kind: 'valuedrivers', scores: data.valueDriverScores },
      })
    }
  }

  // ── Begrippenlijst ─────────────────────────────────────────────────
  if (!beknopt) {
    const begrippen = VAL_BEGRIPPEN_BASE.concat(dcf ? VAL_BEGRIPPEN_DCF : [])
    push([
      '## Begrippenlijst',
      begrippen.map(([t, d]) => `**${t}** — ${d}`).join('\n\n'),
    ])
  }

  // ── Toelichting / Tot slot ─────────────────────────────────────────
  const finNote = vr.financialsNote.trim()
  const vdNote = vr.valueDriversNote.trim()
  const closing = vr.closing.trim()
  if (beknopt) {
    if (finNote || vdNote || closing) {
      push([
        '## Toelichting',
        finNote ? '### Toelichting financiële gegevens\n\n' + finNote : '',
        vdNote ? '### Toelichting value drivers\n\n' + vdNote : '',
        closing ? '### Tot slot\n\n' + closing : '',
      ])
    }
  } else if (closing) {
    push(['## Tot slot', closing])
  }

  // ── Colofon / disclaimer (+ Take 5 contact) ────────────────────────
  if (take5) {
    push([
      '## Contactinformatie',
      `${TAKE5_CONTACT.naam}\n${TAKE5_CONTACT.bedrijf}\n${TAKE5_CONTACT.email}\n${TAKE5_CONTACT.tel}`,
      '## Disclaimer',
      `Take 5 heeft dit waarderingsrapport met zorgvuldigheid samengesteld op basis van door ${naam || 'de onderneming'} verstrekte informatie, maar kan geen garanties geven omtrent de volledigheid of juistheid van alle vermelde gegevens. Potentiële kopers worden geadviseerd om tijdens de due diligence-fase eigen onderzoek te verrichten.`,
      '> Strikt vertrouwelijk document.',
    ])
  } else {
    push([
      '## Disclaimer en colofon',
      'Dit is een geautomatiseerde, indicatieve waardering op basis van marktbenchmarks en de door de aanbieder zelf aangeleverde gegevens. De daadwerkelijke verkoopprijs is afhankelijk van due diligence, onderhandeling en marktomstandigheden.',
      '### Opgesteld door de aanbieder',
      'Dit document is door de aanbieder zelf opgesteld met behulp van het Osago-platform. De aanbieder voert het verkoopproces te allen tijde zelf en is verantwoordelijk voor de inhoud van dit document.',
      '### Positie van het Osago-platform',
      'Osago is geen partij bij, en geen begeleider of adviseur van, de (voorgenomen) transactie en aanvaardt geen aansprakelijkheid voor de inhoud. Aan dit document kunnen geen rechten worden ontleend.',
      '> Aan dit document kunnen geen rechten worden ontleend. De aanbieder is verantwoordelijk voor de inhoud en voert het verkoopproces zelf.',
    ])
  }

  return {
    components,
    inputText: slides.join('\n\n---\n\n'),
    numCards: slides.length,
    pageBg: take5 ? PAGE_BG_TAKE5 : undefined,
    photos,
  }
}
