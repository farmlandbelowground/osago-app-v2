/* eslint-disable no-magic-numbers -- verbatim port of exportDcfToPdf
   (osago-bundle.js:4413); a fixed landscape-A4 layout where naming each
   coordinate/RGB triple would obscure the 1:1 mapping. */
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

import {
  dcfAllYears,
  dcfExportFileBase,
  dcfYearType,
  type DcfExportData,
} from './dcfExportShared'

const INK: [number, number, number] = [10, 31, 20]
const MUTED: [number, number, number] = [110, 120, 115]
const GREEN_DARK: [number, number, number] = [0, 107, 38]
const GREEN_SOFT: [number, number, number] = [230, 247, 235]
const LINE: [number, number, number] = [228, 234, 230]
const MARGIN_X = 12

const fmtEur = (n: number | null | undefined): string =>
  n === null || n === undefined || !isFinite(n)
    ? '—'
    : `€ ${Number(n).toLocaleString('nl-NL', { maximumFractionDigits: 0 })}`

const fmtDec3 = (n: number | null | undefined): string =>
  n === null || n === undefined || !isFinite(n)
    ? '—'
    : Number(n).toFixed(3).replace('.', ',')

// Ports exportDcfToPdf (osago-bundle.js:4413): landscape A4, six autoTable
// sections + footer. Runs in the browser.
export const exportDcfToPdf = (data: DcfExportData): void => {
  const { company, financials, inputs, result } = data
  const b = result.berekening
  const u = inputs.uitgangspunten
  const doc = new jsPDF({ format: 'a4', orientation: 'landscape', unit: 'mm' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  doc.setFillColor(GREEN_DARK[0], GREEN_DARK[1], GREEN_DARK[2])
  doc.rect(0, 0, pageWidth, 4, 'F')
  doc.setTextColor(INK[0], INK[1], INK[2])
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('DCF-export', MARGIN_X, 18)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2])
  doc.text(
    `${company.name || '—'}  ·  KvK ${company.kvkNummer || '—'}  ·  Sector ${company.sector || '—'}  ·  ${new Date().toLocaleDateString('nl-NL')}`,
    MARGIN_X,
    25,
  )

  const headStyles = {
    fillColor: GREEN_SOFT,
    fontSize: 9,
    fontStyle: 'bold' as const,
    lineColor: LINE,
    lineWidth: 0.2,
    textColor: GREEN_DARK,
  }
  const bodyStyles = {
    cellPadding: 2,
    fontSize: 8.5,
    lineColor: LINE,
    lineWidth: 0.1,
    textColor: INK,
  }

  const startYear = inputs.scenarioStartYear
  const yearCount = inputs.scenarioYearCount
  const allYears = dcfAllYears(result)

  autoTable(doc, {
    body: [
      ['Bedrijf', company.name || '—'],
      ['KvK-nummer', company.kvkNummer || '—'],
      ['Sector', company.sector || '—'],
      ['Pas DCF-waardering toe', company.dcfApplyEnabled ? 'Ja' : 'Nee'],
      ['Waarde scenarioperiode', fmtEur(b.totalen.waardeScenario)],
      ['Waarde restperiode', fmtEur(b.totalen.waardeRest)],
      ['Totaal (DCF Waarde)', fmtEur(b.totalen.totaal)],
    ],
    bodyStyles,
    head: [['Overzicht', '']],
    headStyles,
    margin: { left: MARGIN_X, right: MARGIN_X },
    startY: 32,
    theme: 'grid',
  })

  autoTable(doc, {
    body: [
      ['Risk free rate', fmtDec3(inputs.rfr)],
      ['Market risk premium', fmtDec3(inputs.mrp)],
      ['Sectorcorrectie', fmtDec3(inputs.sectoropslag)],
      ['Illiquiditeitspremie', fmtDec3(inputs.ip)],
      ['Subtotaal Disconto', fmtDec3(result.subtotaal1)],
      ['Subtotaal Kwetsbaarheid', fmtDec3(result.kleinPremie)],
      ['Subtotaal Risicoprofiel', fmtDec3(result.alfa)],
      ['Kostenvoet unlevered (WACC)', fmtDec3(result.kostenvoet)],
    ],
    bodyStyles,
    head: [['WACC-componenten', 'Waarde']],
    headStyles,
    margin: { left: MARGIN_X, right: MARGIN_X },
    theme: 'grid',
  })

  autoTable(doc, {
    body: [
      ['Aantal scenariojaren', String(yearCount)],
      ['Scenarioperiode', `${startYear} – ${startYear + yearCount - 1}`],
      ['Rest-jaar', String(startYear + yearCount)],
      ['Disconteringsvoet scenarioperiode (= WACC)', fmtDec3(result.kostenvoet)],
      ['Vermogensvoet rest periode', fmtDec3(u.vermogensvoetRest)],
      ['Restwaarde beperken', u.restwaardeCap ? 'Aan (cap 0,75×)' : 'Uit'],
    ],
    bodyStyles,
    head: [['Uitgangspunten', 'Waarde']],
    headStyles,
    margin: { left: MARGIN_X, right: MARGIN_X },
    theme: 'grid',
  })

  const berekRow = (
    label: string,
    key: keyof (typeof b.data)[number],
    format: (n: number | null | undefined) => string,
  ): string[] => [
    label,
    ...allYears.map(year => format(b.data[year]?.[key] as number | undefined)),
  ]

  doc.addPage()
  autoTable(doc, {
    body: [
      berekRow('Omzet', 'revenue', fmtEur),
      berekRow('EBITDA', 'ebitda', fmtEur),
      berekRow('EBIT', 'ebit', fmtEur),
      berekRow('Nettoresultaat genorm.', 'nettoResultaatGenorm', fmtEur),
      berekRow('NOPLAT', 'noplat', fmtEur),
      berekRow('Free cash flow', 'fcf', fmtEur),
      berekRow('Disconteringsvoet (DF)', 'df', fmtDec3),
      berekRow('Contante waarde FCF', 'cw', fmtEur),
    ],
    bodyStyles: { ...bodyStyles, fontSize: 7.5 },
    head: [['Veld', ...allYears.map(year => `${year}\n(${dcfYearType(result, year)})`)]],
    headStyles: { ...headStyles, fontSize: 7.5 },
    margin: { left: MARGIN_X, right: MARGIN_X },
    startY: 18,
    theme: 'grid',
  })

  const finRow = (
    label: string,
    key: keyof (typeof financials)[number],
  ): string[] => [
    label,
    ...allYears.map(year => fmtEur(financials[year]?.[key] as number | undefined)),
  ]
  autoTable(doc, {
    body: [
      finRow('Omzet', 'revenue'),
      finRow('Kostprijs van de omzet', 'cogs'),
      finRow('Bedrijfskosten', 'operatingExpenses'),
      finRow('Afschrijvingen', 'depreciation'),
      finRow('Rentelasten', 'interest'),
      finRow('Betaalde belastingen', 'taxesPaid'),
    ],
    bodyStyles: { ...bodyStyles, fontSize: 7.5 },
    head: [['Financiële gegevens', ...allYears.map(String)]],
    headStyles: { ...headStyles, fontSize: 7.5 },
    margin: { left: MARGIN_X, right: MARGIN_X },
    theme: 'grid',
  })

  const totalPages = doc.internal.pages.length - 1
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2])
    doc.text(
      `DCF-export ${company.name || ''}  ·  ${new Date().toLocaleDateString('nl-NL')}`,
      MARGIN_X,
      pageHeight - 6,
    )
    doc.text(`Pagina ${page} / ${totalPages}`, pageWidth - MARGIN_X, pageHeight - 6, {
      align: 'right',
    })
  }

  doc.save(`${dcfExportFileBase(company.name)}.pdf`)
}
