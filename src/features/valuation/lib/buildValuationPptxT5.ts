/* eslint-disable no-magic-numbers -- verbatim port of _generateValuationPptxT5
   (osago-bundle.js:16484); a fixed 16:9 slide layout where naming every inch
   coordinate / font size would obscure the 1:1 mapping. */
import PptxGenJS from 'pptxgenjs'

import {
  type FinancialYearInput,
  type ValueDriverSectionScore,
} from '../types'

export interface T5DeckData {
  companyName: string
  dcfree: number
  enterprise: number
  financials: Record<number, FinancialYearInput>
  report: {
    closing: string
    financialsNote: string
    foreword: string
    valueDriversNote: string
  }
  sector: string
  shareholder: number
  userName: string
  useShareholder: boolean
  valuationBand: number | null
  valueDriverScores: ValueDriverSectionScore[]
  werkkap: number
}

const C_NAVY = '0F2945'
const C_GOLD = 'C4A24C'
const C_INK = '0A1F14'
const C_MUTED = '6E7873'
const C_LINE = 'E4EAE6'
const C_SOFT = 'E9EEF6'
const C_WHITE = 'FFFFFF'
const FONT = 'Calibri'
const SLIDE_W = 13.333
const SLIDE_H = 7.5
const MARGIN = 0.6

const fmtEuroCompact = (n: number): string => {
  if (!isFinite(n)) {
    return '€ —'
  }
  if (Math.abs(n) >= 1e6) {
    return `€ ${(n / 1e6).toFixed(2).replace('.', ',')} mln`
  }
  return `€ ${Math.round(n).toLocaleString('nl-NL')}`
}

const fmtEuroExact = (n: number): string => {
  if (!isFinite(n)) {
    return '€ —'
  }
  const v = Math.round(n)
  return `${v < 0 ? '− ' : ''}€ ${Math.abs(v).toLocaleString('nl-NL')}`
}

export const buildValuationPptxT5 = async (data: T5DeckData): Promise<void> => {
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.title = `Waarderingsrapport ${data.companyName}`.trim()
  pptx.author = 'Take 5 Corporate Finance'
  pptx.company = 'Take 5 Corporate Finance'

  const totalValue = data.useShareholder ? data.shareholder : data.enterprise
  const valueLabel = data.useShareholder
    ? 'Aandeelhouderswaarde'
    : 'Ondernemingswaarde'
  const band = data.valuationBand ?? Math.max(50000, Math.round(data.enterprise * 0.1))
  const today = new Date().toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Slide 1 — Cover
  const cover = pptx.addSlide()
  cover.background = { color: C_NAVY }
  cover.addShape(pptx.ShapeType.rect, { fill: { color: C_GOLD }, h: 0.1, line: { type: 'none' }, w: SLIDE_W, x: 0, y: 0 })
  cover.addShape(pptx.ShapeType.rect, { fill: { color: C_GOLD }, h: 0.1, line: { type: 'none' }, w: SLIDE_W, x: 0, y: SLIDE_H - 0.1 })
  cover.addText('TAKE 5', { bold: true, color: C_WHITE, fontFace: FONT, fontSize: 36, h: 0.7, w: 5, x: MARGIN, y: 0.5 })
  cover.addText('CORPORATE FINANCE', { charSpacing: 4, color: C_GOLD, fontFace: FONT, fontSize: 12, h: 0.35, w: 5, x: MARGIN, y: 1.15 })
  cover.addText('Waarderingsrapport', { align: 'center', color: C_WHITE, fontFace: FONT, fontSize: 44, h: 0.9, w: SLIDE_W - 2 * MARGIN, x: MARGIN, y: 2.5 })
  cover.addText(data.companyName || 'jouw onderneming', { align: 'center', bold: true, color: C_GOLD, fontFace: FONT, fontSize: 36, h: 0.9, w: SLIDE_W - 2 * MARGIN, x: MARGIN, y: 3.4 })
  cover.addText('Indicatieve waardebepaling', { align: 'center', color: C_WHITE, fontFace: FONT, fontSize: 14, h: 0.4, italic: true, w: SLIDE_W - 2 * MARGIN, x: MARGIN, y: 4.3 })
  cover.addText(`Rapportdatum: ${today}`, { align: 'center', color: C_WHITE, fontFace: FONT, fontSize: 12, h: 0.4, w: SLIDE_W - 2 * MARGIN, x: MARGIN, y: 5.6 })
  if (data.userName) {
    cover.addText(`Opgesteld voor ${data.userName}`, { align: 'center', color: C_WHITE, fontFace: FONT, fontSize: 12, h: 0.4, w: SLIDE_W - 2 * MARGIN, x: MARGIN, y: 6.0 })
  }

  let pageNum = 1
  const newSlide = (title: string): PptxGenJS.Slide => {
    pageNum++
    const slide = pptx.addSlide()
    slide.background = { color: C_WHITE }
    slide.addShape(pptx.ShapeType.rect, { fill: { color: C_GOLD }, h: 0.06, line: { type: 'none' }, w: SLIDE_W, x: 0, y: 0 })
    slide.addText('TAKE 5', { bold: true, color: C_NAVY, fontFace: FONT, fontSize: 18, h: 0.35, w: 3, x: MARGIN, y: 0.18 })
    slide.addShape(pptx.ShapeType.rect, { fill: { color: C_NAVY }, h: 0.35, line: { type: 'none' }, w: SLIDE_W, x: 0, y: SLIDE_H - 0.35 })
    slide.addText('© Take 5 Corporate Finance', { color: C_WHITE, fontFace: FONT, fontSize: 9, h: 0.28, w: 4, x: MARGIN, y: SLIDE_H - 0.32 })
    slide.addText(String(pageNum), { align: 'right', color: C_WHITE, fontFace: FONT, fontSize: 9, h: 0.28, w: 1, x: SLIDE_W - MARGIN - 1, y: SLIDE_H - 0.32 })
    slide.addText(title, { bold: true, color: C_NAVY, fontFace: FONT, fontSize: 26, h: 0.6, w: SLIDE_W - 2 * MARGIN, x: MARGIN, y: 1.1 })
    return slide
  }

  // Slide 2 — Voorwoord (conditional)
  if (data.report.foreword.trim()) {
    newSlide('Voorwoord').addText(data.report.foreword.trim(), { color: C_INK, fontFace: FONT, fontSize: 13, h: 5, paraSpaceAfter: 6, valign: 'top', w: SLIDE_W - 2 * MARGIN, x: MARGIN, y: 1.9 })
  }

  // Slide 3 — Indicatieve waarde
  const valueSlide = newSlide('Indicatieve waardebepaling')
  valueSlide.addShape(pptx.ShapeType.roundRect, { fill: { color: C_NAVY }, h: 2.5, line: { type: 'none' }, rectRadius: 0.08, w: SLIDE_W - 2 * MARGIN, x: MARGIN, y: 2.0 })
  valueSlide.addText(valueLabel.toUpperCase(), { charSpacing: 2, color: C_GOLD, fontFace: FONT, fontSize: 11, h: 0.4, w: SLIDE_W - 2 * (MARGIN + 0.4), x: MARGIN + 0.4, y: 2.2 })
  valueSlide.addText(fmtEuroCompact(totalValue), { bold: true, color: C_WHITE, fontFace: FONT, fontSize: 54, h: 1.1, w: SLIDE_W - 2 * (MARGIN + 0.4), x: MARGIN + 0.4, y: 2.65 })
  valueSlide.addText(`Bandbreedte: ${fmtEuroCompact(totalValue - band)} – ${fmtEuroCompact(totalValue + band)}`, { color: C_WHITE, fontFace: FONT, fontSize: 13, h: 0.4, w: SLIDE_W - 2 * (MARGIN + 0.4), x: MARGIN + 0.4, y: 3.85 })
  valueSlide.addText('Deze waarde is gebaseerd op de aangeleverde financiële parameters, waardedrijvers en marktbenchmarks. Uitkomsten zijn indicatief en geven geen garantie op een te realiseren transactieprijs.', { color: C_MUTED, fontFace: FONT, fontSize: 11, h: 1.6, paraSpaceAfter: 6, w: SLIDE_W - 2 * MARGIN, x: MARGIN, y: 4.8 })

  // Slide 4 — Aandeelhouderswaarde breakdown (conditional)
  if (data.useShareholder) {
    const sign = (n: number): string => (n < 0 ? '− ' : '+ ')
    const rows: PptxGenJS.TableRow[] = [
      [
        { options: { bold: true, color: C_NAVY, fill: { color: C_SOFT }, fontFace: FONT, fontSize: 11 }, text: 'Component' },
        { options: { align: 'right', bold: true, color: C_NAVY, fill: { color: C_SOFT }, fontFace: FONT, fontSize: 11 }, text: 'Bedrag' },
      ],
      [
        { options: { color: C_INK, fontFace: FONT, fontSize: 11 }, text: 'Indicatieve ondernemingswaarde' },
        { options: { align: 'right', color: C_INK, fontFace: FONT, fontSize: 11 }, text: fmtEuroExact(data.enterprise) },
      ],
      [
        { options: { color: C_INK, fontFace: FONT, fontSize: 11 }, text: `${sign(data.werkkap)}Verrekening werkkapitaal` },
        { options: { align: 'right', color: C_INK, fontFace: FONT, fontSize: 11 }, text: fmtEuroExact(Math.abs(data.werkkap)) },
      ],
      [
        { options: { color: C_INK, fontFace: FONT, fontSize: 11 }, text: `${sign(data.dcfree)}Debt- en cash-free verrekening` },
        { options: { align: 'right', color: C_INK, fontFace: FONT, fontSize: 11 }, text: fmtEuroExact(Math.abs(data.dcfree)) },
      ],
      [
        { options: { bold: true, color: C_NAVY, fill: { color: C_SOFT }, fontFace: FONT, fontSize: 12 }, text: 'Totaal aandeelhouderswaarde' },
        { options: { align: 'right', bold: true, color: C_NAVY, fill: { color: C_SOFT }, fontFace: FONT, fontSize: 12 }, text: fmtEuroExact(data.shareholder) },
      ],
    ]
    newSlide('Opbouw aandeelhouderswaarde').addTable(rows, { border: { color: C_LINE, pt: 0.5, type: 'solid' }, colW: [(SLIDE_W - 2 * MARGIN) * 0.7, (SLIDE_W - 2 * MARGIN) * 0.3], rowH: 0.4, w: SLIDE_W - 2 * MARGIN, x: MARGIN, y: 1.95 })
  }

  // Slide 5 — Financiële kerncijfers
  const finSlide = newSlide('Financiële kerncijfers')
  const finYears = Object.keys(data.financials)
    .map(y => parseInt(y, 10))
    .filter(y => !isNaN(y))
    .sort((a, b) => a - b)
    .slice(-3)
  if (finYears.length === 0) {
    finSlide.addText('Geen financiële cijfers beschikbaar.', { color: C_MUTED, fontFace: FONT, fontSize: 13, h: 0.5, italic: true, w: SLIDE_W - 2 * MARGIN, x: MARGIN, y: 2.0 })
  } else {
    const headerRow: PptxGenJS.TableRow = [
      { options: { bold: true, color: C_NAVY, fill: { color: C_SOFT }, fontFace: FONT, fontSize: 11 }, text: 'Bedragen in €' },
      ...finYears.map(y => ({ options: { align: 'right' as const, bold: true, color: C_NAVY, fill: { color: C_SOFT }, fontFace: FONT, fontSize: 11 }, text: String(y) })),
    ]
    const metrics: [keyof FinancialYearInput, string][] = [
      ['revenue', 'Omzet'],
      ['cogs', 'Kostprijs verkopen'],
      ['operatingExpenses', 'Operationele kosten'],
      ['depreciation', 'Afschrijvingen'],
      ['interest', 'Rentelasten'],
      ['taxesPaid', 'Belastingen'],
    ]
    const rows: PptxGenJS.TableRow[] = [headerRow]
    metrics.forEach(([key, label]) => {
      rows.push([
        { options: { color: C_INK, fontFace: FONT, fontSize: 11 }, text: label },
        ...finYears.map(y => {
          const value = data.financials[y]?.[key]
          return { options: { align: 'right' as const, color: C_INK, fontFace: FONT, fontSize: 11 }, text: typeof value === 'number' ? fmtEuroExact(value) : '—' }
        }),
      ])
    })
    const totalW = SLIDE_W - 2 * MARGIN
    finSlide.addTable(rows, { border: { color: C_LINE, pt: 0.5, type: 'solid' }, colW: [totalW * 0.4, ...finYears.map(() => (totalW * 0.6) / finYears.length)], rowH: 0.38, w: totalW, x: MARGIN, y: 1.95 })
  }
  if (data.report.financialsNote.trim()) {
    finSlide.addText(data.report.financialsNote.trim(), { color: C_MUTED, fontFace: FONT, fontSize: 10, h: 1, w: SLIDE_W - 2 * MARGIN, x: MARGIN, y: 5.95 })
  }

  // Slide 6 — Waardedrijvers
  const vdSlide = newSlide('Waardedrijvers')
  vdSlide.addText('Gewogen score per thema, gebaseerd op de antwoorden bij Value drivers.', { color: C_MUTED, fontFace: FONT, fontSize: 11, h: 0.4, italic: true, w: SLIDE_W - 2 * MARGIN, x: MARGIN, y: 1.85 })
  data.valueDriverScores.slice(0, 7).forEach((driver, index) => {
    const y = 2.4 + index * 0.5
    vdSlide.addText(driver.title, { bold: true, color: C_NAVY, fontFace: FONT, fontSize: 12, h: 0.4, w: 4, x: MARGIN, y })
    vdSlide.addShape(pptx.ShapeType.roundRect, { fill: { color: C_SOFT }, h: 0.22, line: { type: 'none' }, rectRadius: 0.05, w: 6, x: MARGIN + 4.2, y: y + 0.13 })
    const score = typeof driver.score === 'number' ? Math.max(0, Math.min(100, driver.score)) : 0
    if (score > 0.05) {
      vdSlide.addShape(pptx.ShapeType.roundRect, { fill: { color: C_NAVY }, h: 0.22, line: { type: 'none' }, rectRadius: 0.05, w: (6 * score) / 100, x: MARGIN + 4.2, y: y + 0.13 })
    }
    vdSlide.addText(`${Math.round(score)}/100`, { bold: true, color: C_NAVY, fontFace: FONT, fontSize: 11, h: 0.4, w: 1.5, x: MARGIN + 10.35, y })
  })
  if (data.report.valueDriversNote.trim()) {
    vdSlide.addText(data.report.valueDriversNote.trim(), { color: C_MUTED, fontFace: FONT, fontSize: 10, h: 0.7, w: SLIDE_W - 2 * MARGIN, x: MARGIN, y: 6.3 })
  }

  // Slide 7 — Tot slot (conditional)
  if (data.report.closing.trim()) {
    newSlide('Tot slot').addText(data.report.closing.trim(), { color: C_INK, fontFace: FONT, fontSize: 13, h: 5, paraSpaceAfter: 6, valign: 'top', w: SLIDE_W - 2 * MARGIN, x: MARGIN, y: 1.9 })
  }

  // Slide 8 — Disclaimer
  const disc = newSlide('Disclaimer')
  disc.addShape(pptx.ShapeType.roundRect, { fill: { color: C_SOFT }, h: 4.0, line: { color: C_NAVY, width: 1 }, rectRadius: 0.08, w: SLIDE_W - 2 * MARGIN, x: MARGIN, y: 2.0 })
  disc.addText('Deze waardering is opgesteld op basis van door de opdrachtgever aangeleverde financiële parameters, waardedrijvers en marktbenchmarks. De uitkomst is uitdrukkelijk indicatief en geen garantie op een te realiseren transactieprijs — die is afhankelijk van due diligence, onderhandeling en marktomstandigheden. Take 5 Corporate Finance aanvaardt geen aansprakelijkheid voor de volledigheid en juistheid van deze waardering. Het rapport is uitsluitend bestemd voor de opdrachtgever.', { color: C_INK, fontFace: FONT, fontSize: 13, h: 3.4, paraSpaceAfter: 6, valign: 'top', w: SLIDE_W - 2 * (MARGIN + 0.4), x: MARGIN + 0.4, y: 2.3 })

  await pptx.writeFile({
    fileName: `Take5 Waarderingsrapport ${(data.companyName || 'onderneming').trim()}.pptx`,
  })
}
