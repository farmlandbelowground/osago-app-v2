// Server-side PDF-injection tuning — ported VERBATIM from legacy #70
// (osago-bundle.js injectImagesIntoPdf / drawPdfMeasured / measurePageTextBottoms).
// These numbers are load-bearing: they decide whether an injected component
// overlaps the Gamma-rendered text (spec §13.3).

// injectImagesIntoPdf cfg (fractions/points of the page).
export const INJECT_SAFETY = 12
export const INJECT_GAP = 10
export const INJECT_MAXW = 0.86

// measurePageTextBottoms: descender margin — makes the measured text bottom
// conservative so a component never lands too high.
export const MEASURE_DESCENDER = 0.33

// drawPdfMeasured fallback ladder.
export const MEASURED_CONTENT_TOP_LIMIT = 0.75 // full width may not push content below 0.75·maxY
export const MEASURED_WIDTH_FLOOR = 0.6 // else shrink width toward this floor of page width
export const MEASURED_SCALE_FLOOR = 0.55 // uniform-scale floor (~max 25% shrink)

// Page fill colour when drawPdfMeasured shifts/scales a page. Take 5 pages have
// a light purple tint; Osago stays white (spec §13.4).
export const PAGE_BG_OSAGO: [number, number, number] = [1, 1, 1]
export const PAGE_BG_TAKE5: [number, number, number] = [0.98, 0.984, 0.988]

// Take 5 house style. Verified against the Take 5 IM Generator — NOT navy/gold
// (that was wrong in the old jsPDF _generateValuationPptxT5). Osago's --green
// counterpart is purple.
export const T5_COLORS = {
  orange: '#EB6C0E',
  orangeLight: '#F17011',
  purple: '#301F40',
  purpleLight: '#C1B6D3',
  purpleSoft: '#F6F4F9',
  text: '#011119',
} as const

// Osago value-gauge palette — mirrors the .shv-* CSS in globals.css so the
// server-rendered SVG matches the on-screen slider (spec §9.3 / §11.1 Option B).
export const OSAGO_GAUGE_COLORS = {
  green: '#00b33c',
  greenDark: '#009a33',
  greenSoft: '#f1fbf4',
  ink2: '#1f3328',
  line: '#e4eae6',
  muted: '#5c6b62',
} as const

// Value-driver bar — SEMANTIC gradient (slecht→matig→goed). Never recoloured for
// Take 5; these colours mean bad/ok/good, not brand (spec §13.7).
export const VALUE_DRIVER_COLORS = {
  bad: '#e5484d',
  good: '#00B33C',
  headerLabel: '#6b7280',
  ink: '#0A1F14',
  ok: '#f5a623',
} as const
