import { createRequire } from 'node:module'

import { MEASURE_DESCENDER } from './constants'
import { type PageTextMeasure } from './types'

// Minimal surface of the pdfjs-dist API we use for text-only extraction.
interface PdfjsTextItem {
  transform: number[]
  height?: number
  str?: string
}
interface PdfjsTextContent {
  items: PdfjsTextItem[]
}
interface PdfjsViewport {
  height: number
  width: number
}
interface PdfjsPage {
  getTextContent: () => Promise<PdfjsTextContent>
  getViewport: (options: { scale: number }) => PdfjsViewport
}
interface PdfjsDocument {
  destroy: () => Promise<void>
  getPage: (pageNumber: number) => Promise<PdfjsPage>
  numPages: number
}
interface PdfjsLib {
  getDocument: (options: {
    data: Uint8Array
    isEvalSupported?: boolean
    useSystemFonts?: boolean
    useWorkerFetch?: boolean
  }) => { promise: Promise<PdfjsDocument> }
}

// Measures per-page where the text actually ends, with pdf.js in Node. Returns
// top-origin points (0 = top) per page, or null if the measurement fails — then
// every measured placement falls back to the fixed rect instead of crashing.
// Ports measurePageTextBottoms (osago-bundle.js #70). pdfjs-dist 3.11.174 legacy
// build runs headless in Node (no worker, no canvas — text extraction only).
export const measurePageTextBottoms = async (
  bytes: Uint8Array,
): Promise<PageTextMeasure[] | null> => {
  try {
    const require = createRequire(import.meta.url)
    const pdfjs = require('pdfjs-dist/legacy/build/pdf.js') as PdfjsLib

    // Copy: pdf.js can detach the underlying buffer (transferable).
    const data = bytes.slice(0)
    const doc = await pdfjs.getDocument({
      data,
      isEvalSupported: false,
      useSystemFonts: true,
      useWorkerFetch: false,
    }).promise

    const out: PageTextMeasure[] = []
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const vp = page.getViewport({ scale: 1 }) // 1 unit = 1 PDF point (= pdf-lib)
      const pageHeight = vp.height
      const tc = await page.getTextContent()
      let minY = Infinity
      let maxY = -Infinity
      let words = 0
      for (const item of tc.items) {
        if (!item.str || !item.str.trim()) {
          continue
        }
        const baseline = item.transform[5] // baseline from BOTTOM
        const glyphHeight =
          item.height || Math.hypot(item.transform[1], item.transform[3])
        minY = Math.min(minY, pageHeight - (baseline + glyphHeight)) // glyph top, top-origin
        maxY = Math.max(
          maxY,
          pageHeight - baseline + MEASURE_DESCENDER * glyphHeight,
        ) // glyph bottom, top-origin
        words++
      }
      out.push({ h: pageHeight, maxY, minY, w: vp.width, words })
    }
    try {
      await doc.destroy()
    } catch {
      // Best-effort cleanup.
    }
    return out
  } catch (err) {
    console.warn('[Gamma] pdf.js-meting mislukt — injectie zonder meting:', err)
    return null
  }
}
