/* eslint-disable no-magic-numbers -- verbatim coordinate-for-coordinate port of
   the legacy jsPDF verbeterrapport drawing (osago-bundle.js:7736-7908); naming
   each layout offset would obscure the 1:1 mapping to the original. */
import { jsPDF } from 'jspdf'

import {
  SCORECARD_ANSWER_OPTIONS,
  SCORECARD_IMPROVEMENT_PRIORITIES,
} from '../constants/answerOptions'
import {
  PDF_FOOTER_H,
  PDF_GREEN,
  PDF_GREEN_DARK,
  PDF_GREEN_SOFT,
  PDF_INK,
  PDF_LINE,
  PDF_LOGO_HEIGHT,
  PDF_LOGO_WIDTH,
  PDF_MARGIN_X,
  PDF_MUTED,
  PDF_PRIORITY_COLORS,
  type RgbTriple,
} from '../constants/reportPdf'
import { type ScorecardImprovementReportData } from '../types'

export interface ImprovementReportPdfInput {
  companyName: string
  data: ScorecardImprovementReportData
  logoDataUrl: string
  sector: string | null
}

export interface ImprovementReportPdfResult {
  base64: string
  description: string
  fileName: string
}

export const buildImprovementReportPdf = ({
  companyName,
  data,
  logoDataUrl,
  sector,
}: ImprovementReportPdfInput): ImprovementReportPdfResult => {
  const doc = new jsPDF({ format: 'a4', orientation: 'portrait', unit: 'mm' })
  const PW = doc.internal.pageSize.getWidth()
  const PH = doc.internal.pageSize.getHeight()
  const CONTENT_W = PW - 2 * PDF_MARGIN_X

  const setFill = (rgb: RgbTriple): void => {
    doc.setFillColor(rgb[0], rgb[1], rgb[2])
  }
  const setText = (rgb: RgbTriple): void => {
    doc.setTextColor(rgb[0], rgb[1], rgb[2])
  }
  const setDraw = (rgb: RgbTriple): void => {
    doc.setDrawColor(rgb[0], rgb[1], rgb[2])
  }

  let y = 0
  const ensureRoom = (needed: number): void => {
    if (y + needed > PH - PDF_FOOTER_H) {
      doc.addPage()
      y = PDF_MARGIN_X
    }
  }

  // Cover
  setFill(PDF_GREEN)
  doc.rect(0, 0, PW, 6, 'F')
  try {
    doc.addImage(logoDataUrl, 'PNG', PDF_MARGIN_X, 14, PDF_LOGO_WIDTH, PDF_LOGO_HEIGHT)
  } catch {
    setText(PDF_GREEN)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('osago', PDF_MARGIN_X, 18)
  }

  setText(PDF_INK)
  doc.setFont('times', 'normal')
  doc.setFontSize(32)
  doc.text('Verbeterrapport', PDF_MARGIN_X, 60)
  doc.setFont('times', 'italic')
  doc.setFontSize(14)
  setText(PDF_MUTED)
  doc.text(
    'Verkoopklaar maken — actiepunten o.b.v. de Take 5-scan',
    PDF_MARGIN_X,
    70,
  )

  setText(PDF_INK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(companyName || '—', PDF_MARGIN_X, 92)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10.5)
  setText(PDF_MUTED)
  const today = new Date().toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  doc.text(`Rapportdatum: ${today}`, PDF_MARGIN_X, 100)
  if (sector) {
    doc.text(`Sector: ${sector}`, PDF_MARGIN_X, 106)
  }

  // Summary card
  const sumY = 118
  const sumH = 56
  setFill(PDF_GREEN_SOFT)
  setDraw(PDF_GREEN)
  doc.setLineWidth(0.3)
  doc.roundedRect(PDF_MARGIN_X, sumY, CONTENT_W, sumH, 3, 3, 'FD')

  setText(PDF_GREEN_DARK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.text('VERKOOPKLAAR-RATING', PDF_MARGIN_X + 6, sumY + 9)
  doc.text('VERBETERPUNTEN', PDF_MARGIN_X + CONTENT_W / 2 + 4, sumY + 9)

  setText(PDF_INK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.text(`${data.overallPct}%`, PDF_MARGIN_X + 6, sumY + 24)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  setText(PDF_MUTED)
  doc.text(
    `${data.overallLabel} · ${data.totalAnswered} van ${data.totalQuestions} vragen beoordeeld`,
    PDF_MARGIN_X + 6,
    sumY + 31,
  )

  setText(PDF_INK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.text(String(data.totalPoints), PDF_MARGIN_X + CONTENT_W / 2 + 4, sumY + 24)
  setText(PDF_MUTED)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const breakdown = [
    data.hoogCount > 0 ? `${data.hoogCount} hoog` : '',
    data.middelCount > 0 ? `${data.middelCount} middel` : '',
    data.laagCount > 0 ? `${data.laagCount} laag` : '',
  ]
    .filter(Boolean)
    .join(' · ')
  doc.text(breakdown, PDF_MARGIN_X + CONTENT_W / 2 + 4, sumY + 31)

  setText(PDF_MUTED)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const introLines = doc.splitTextToSize(
    'Dit rapport bundelt de onderwerpen waar de onderneming nog niet volledig op orde is. Per categorie staan de actiepunten in volgorde van prioriteit (Hoog → Middel → Laag), op basis van de antwoorden in de Verkoopklaar maken-scan. Vragen die als "Niet van toepassing" zijn gemarkeerd of nog niet beantwoord zijn, zijn niet opgenomen.',
    CONTENT_W - 12,
  )
  doc.text(introLines, PDF_MARGIN_X + 6, sumY + 42)

  // Per-category sections
  y = sumY + sumH + 14
  for (const block of data.categories) {
    ensureRoom(20)
    setFill(PDF_GREEN)
    doc.rect(PDF_MARGIN_X, y, 3, 6, 'F')
    setText(PDF_INK)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(block.category.label, PDF_MARGIN_X + 7, y + 5)
    setText(PDF_MUTED)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(
      `${block.points.length} verbeterpunt${block.points.length === 1 ? '' : 'en'}`,
      PW - PDF_MARGIN_X,
      y + 5,
      { align: 'right' },
    )
    y += 11
    setDraw(PDF_LINE)
    doc.setLineWidth(0.2)
    doc.line(PDF_MARGIN_X, y, PW - PDF_MARGIN_X, y)
    y += 5

    for (const point of block.points) {
      const prio = SCORECARD_IMPROVEMENT_PRIORITIES[point.answer]
      const color = PDF_PRIORITY_COLORS[point.answer]
      const noteLines = point.notes
        ? doc.splitTextToSize(`Notitie: ${point.notes}`, CONTENT_W - 8)
        : []
      const labelLines = doc.splitTextToSize(point.item.label, CONTENT_W - 8 - 16)
      const rowH =
        6 +
        labelLines.length * 5 +
        (noteLines.length > 0 ? 4 + noteLines.length * 4.5 : 0) +
        4
      ensureRoom(rowH + 2)

      setFill(color)
      doc.roundedRect(PDF_MARGIN_X, y, 14, 6, 1.5, 1.5, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.text(prio.label.toUpperCase(), PDF_MARGIN_X + 7, y + 4.2, {
        align: 'center',
      })

      setText(PDF_INK)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(labelLines, PDF_MARGIN_X + 18, y + 4.5)
      let blockY = y + 4.5 + labelLines.length * 5

      setText(PDF_MUTED)
      doc.setFontSize(8.5)
      const option = SCORECARD_ANSWER_OPTIONS.find(
        candidate => candidate.id === point.answer,
      )
      doc.text(
        `Huidig antwoord: ${option ? option.short : '—'} (${prio.weight}%)`,
        PDF_MARGIN_X + 18,
        blockY + 1,
      )
      blockY += 4

      if (noteLines.length > 0) {
        setText(PDF_INK)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'italic')
        doc.text(noteLines, PDF_MARGIN_X + 18, blockY + 4)
        blockY += 4 + noteLines.length * 4.5
      }
      y = blockY + 5
    }
    y += 4
  }

  // Footers on every page
  const totalPages = doc.internal.pages.length - 1
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page)
    setText(PDF_INK)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('© Osago — Verbeterrapport', PDF_MARGIN_X, PH - 8)
    setText(PDF_MUTED)
    doc.setFontSize(8)
    doc.text(`${page} / ${totalPages}`, PW - PDF_MARGIN_X, PH - 8, {
      align: 'right',
    })
    doc.text(
      'Vertrouwelijk — uitsluitend voor de opdrachtgever',
      PW / 2,
      PH - 8,
      { align: 'center' },
    )
  }

  const safeName = (companyName || 'onderneming').trim()
  const dataUri = doc.output('datauristring')

  return {
    base64: dataUri.slice(dataUri.indexOf(',') + 1),
    description: `Verbeterrapport (Verkoopklaar maken) — ${data.totalPoints} actiepunt${data.totalPoints === 1 ? '' : 'en'}`,
    fileName: `Verbeterrapport ${safeName}.pdf`,
  }
}
