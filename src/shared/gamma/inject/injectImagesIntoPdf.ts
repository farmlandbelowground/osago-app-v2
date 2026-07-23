import { PDFDocument, type PDFImage, type PDFPage, rgb } from 'pdf-lib'

import {
  INJECT_GAP,
  INJECT_MAXW,
  INJECT_SAFETY,
  MEASURED_CONTENT_TOP_LIMIT,
  MEASURED_SCALE_FLOOR,
  MEASURED_WIDTH_FLOOR,
  PAGE_BG_OSAGO,
} from './constants'
import { measurePageTextBottoms } from './measure'
import { type PageTextMeasure, type ResolvedPlacement } from './types'

const isRasterExt = (ext: string): boolean => {
  const e = ext.toLowerCase()
  return e === 'png' || e === 'jpeg' || e === 'jpg'
}

// Places an image on a fixed fractional rect, aspect-preserving + centred
// ("contain"). For photos in the reserved grid column. Ports drawPdfOverlay
// (osago-bundle.js #70). PDF y is measured from the BOTTOM; our rects from top.
const drawPdfOverlay = (
  page: PDFPage,
  img: PDFImage,
  placement: ResolvedPlacement,
): void => {
  const pw = page.getWidth()
  const ph = page.getHeight()
  const boxX = placement.rect.x * pw
  const boxW = placement.rect.w * pw
  const boxYTop = placement.rect.y * ph
  const boxH = placement.rect.h * ph
  let dw = boxW
  let dh = boxH
  const natW = placement.natW || img.width
  const natH = placement.natH || img.height
  if (natW && natH && boxW > 0 && boxH > 0) {
    const imgAR = natW / natH
    const boxAR = boxW / boxH
    if (imgAR > boxAR) {
      dw = boxW
      dh = boxW / imgAR
    } else {
      dh = boxH
      dw = boxH * imgAR
    }
  }
  const x = boxX + (boxW - dw) / 2
  const yTop = boxYTop + (boxH - dh) / 2
  page.drawImage(img, { height: dh, width: dw, x, y: ph - yTop - dh })
}

// Places a wide, flat component (value slider / value-drivers) INTO the page,
// below the text. Measures the free bottom band; if it doesn't fit, shifts the
// content up; if it still doesn't fit, uniformly scales the content (max ~25%
// smaller). So the slider never lands on a separate page and never overlaps the
// text. Ports drawPdfMeasured (osago-bundle.js #70) verbatim.
const drawPdfMeasured = async (
  pdf: PDFDocument,
  index: number,
  m: PageTextMeasure,
  img: PDFImage,
  bg: [number, number, number],
): Promise<void> => {
  const page = pdf.getPage(index)
  const pw = page.getWidth()
  const ph = page.getHeight()
  const aspect = img.width / img.height

  let dispW0 = INJECT_MAXW * pw
  {
    // Would full width push the content below 0.75? Then make the slider
    // narrower (down to 60% page width) instead of scaling the text too small.
    const bf0 = ph - m.maxY - INJECT_SAFETY
    const tf0 = Math.max(0, m.minY - INJECT_SAFETY)
    const need0 = dispW0 / aspect + 2 * INJECT_GAP
    if (bf0 < need0 && tf0 + bf0 < need0) {
      const wCap =
        (ph -
          MEASURED_CONTENT_TOP_LIMIT * m.maxY -
          INJECT_SAFETY -
          2 * INJECT_GAP) *
        aspect
      dispW0 = Math.min(dispW0, Math.max(MEASURED_WIDTH_FLOOR * pw, wCap))
    }
  }
  const need = dispW0 / aspect + 2 * INJECT_GAP
  const bottomFree = ph - m.maxY - INJECT_SAFETY
  const topFree = Math.max(0, m.minY - INJECT_SAFETY)
  let bandTop: number
  if (bottomFree >= need) {
    bandTop = m.maxY + INJECT_SAFETY // fits at the bottom
  } else if (topFree + bottomFree >= need) {
    const delta = need - bottomFree // shift the content up
    const [emb] = await pdf.embedPages([page])
    const np = pdf.insertPage(index, [pw, ph])
    np.drawRectangle({
      color: rgb(bg[0], bg[1], bg[2]),
      height: ph,
      width: pw,
      x: 0,
      y: 0,
    })
    np.drawPage(emb, { x: 0, y: delta })
    pdf.removePage(index + 1)
    bandTop = m.maxY - delta + INJECT_SAFETY
  } else {
    const scale = Math.max(
      MEASURED_SCALE_FLOOR,
      (ph - need - INJECT_SAFETY) / m.maxY,
    ) // scale the content
    const [emb] = await pdf.embedPages([page])
    const np = pdf.insertPage(index, [pw, ph])
    np.drawRectangle({
      color: rgb(bg[0], bg[1], bg[2]),
      height: ph,
      width: pw,
      x: 0,
      y: 0,
    })
    np.drawPage(emb, {
      x: (pw - scale * pw) / 2,
      xScale: scale,
      y: ph - scale * ph,
      yScale: scale,
    })
    pdf.removePage(index + 1)
    bandTop = scale * m.maxY + INJECT_SAFETY
  }
  const target = pdf.getPage(index)
  const band = ph - bandTop - INJECT_GAP
  const dispW = Math.min(
    INJECT_MAXW * pw,
    Math.max(1, band - INJECT_GAP) * aspect,
  )
  const dispH = dispW / aspect
  const x = (pw - dispW) / 2
  const yTop = bandTop + (band - dispH) / 2 + INJECT_GAP / 2
  target.drawImage(img, {
    height: dispH,
    width: dispW,
    x,
    y: ph - yTop - dispH,
  })
}

// Injects our own images into the Gamma-rendered PDF. `measured` placements
// (sliders/charts that must live IN the page) are measured + shifted/scaled;
// the rest (photos in the reserved column) are drawn on a fixed rect. Measured
// placements run FIRST so a page rebuild keeps the index stable for the overlay
// pass. Ports injectImagesIntoPdf (osago-bundle.js #70) to Node/pdf-lib.
export const injectImagesIntoPdf = async (
  pdfBytes: Uint8Array,
  placements: ResolvedPlacement[],
  pageBg: [number, number, number] = PAGE_BG_OSAGO,
): Promise<Uint8Array> => {
  // Safety net: pdf-lib only embeds png/jpeg; anything else would fail silently.
  const safe = placements.filter(placement => {
    const ok = isRasterExt(placement.ext)
    if (!ok) {
      console.warn(
        '[Gamma] PDF-injectie overgeslagen — onveilig beeldformaat:',
        placement.ext,
      )
    }
    return ok
  })

  // Only measure when there ARE measured placements; a failed measurement is
  // null, so those placements fall back to the fixed rect (old behavior).
  const wantMeasure = safe.some(placement => placement.mode === 'measured')
  const measure = wantMeasure ? await measurePageTextBottoms(pdfBytes) : null

  const pdf = await PDFDocument.load(pdfBytes)

  const embed = async (
    placement: ResolvedPlacement,
  ): Promise<PDFImage | null> => {
    try {
      return placement.ext.toLowerCase() === 'png'
        ? await pdf.embedPng(placement.bytes)
        : await pdf.embedJpg(placement.bytes)
    } catch (err) {
      console.warn(
        '[Gamma] PDF-injectie: afbeelding kon niet worden ingebed:',
        err,
      )
      return null
    }
  }

  for (const placement of safe) {
    if (placement.mode !== 'measured') {
      continue
    }
    const idx = (placement.slide || 1) - 1
    if (idx < 0 || idx >= pdf.getPageCount()) {
      continue
    }
    const img = await embed(placement)
    if (!img) {
      continue
    }
    const m =
      measure && measure[idx] && measure[idx].words ? measure[idx] : null
    if (m) {
      await drawPdfMeasured(pdf, idx, m, img, pageBg)
    } else {
      drawPdfOverlay(pdf.getPage(idx), img, placement)
    }
  }

  for (const placement of safe) {
    if (placement.mode === 'measured') {
      continue
    }
    const idx = (placement.slide || 1) - 1
    if (idx < 0 || idx >= pdf.getPageCount()) {
      continue
    }
    const img = await embed(placement)
    if (!img) {
      continue
    }
    drawPdfOverlay(pdf.getPage(idx), img, placement)
  }

  return pdf.save()
}
