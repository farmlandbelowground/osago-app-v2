// A placement resolved to concrete image bytes, ready for pdf-lib. Ports the
// legacy placement objects passed to injectImagesIntoPdf (osago-bundle.js #70).
export interface ResolvedPlacement {
  bytes: Uint8Array
  ext: string
  mode: 'measured' | 'overlay'
  rect: { h: number; w: number; x: number; y: number }
  slide: number
  natH?: number
  natW?: number
}

// Per-page text bounds measured by pdf.js, in top-origin PDF points
// (0 = top of page). Ports measurePageTextBottoms' return (osago-bundle.js #70).
export interface PageTextMeasure {
  h: number
  maxY: number
  minY: number
  w: number
  words: number
}
