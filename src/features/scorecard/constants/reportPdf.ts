import { type ScorecardImprovementPriorityId } from '../types'

export type RgbTriple = [number, number, number]

// Verbeterrapport jsPDF palette, ported verbatim (osago-bundle.js:7739-7749).
export const PDF_INK: RgbTriple = [10, 31, 20]
export const PDF_MUTED: RgbTriple = [110, 120, 115]
export const PDF_GREEN: RgbTriple = [0, 179, 60]
export const PDF_GREEN_DARK: RgbTriple = [0, 107, 38]
export const PDF_GREEN_SOFT: RgbTriple = [230, 247, 235]
export const PDF_LINE: RgbTriple = [228, 234, 230]
export const PDF_WHITE: RgbTriple = [255, 255, 255]

// Priority pill colour per answer (osago-bundle.js:7695-7699).
export const PDF_PRIORITY_COLORS: Record<
  ScorecardImprovementPriorityId,
  RgbTriple
> = {
  gedeeltelijk: [217, 119, 6],
  grotendeels: [180, 145, 30],
  niet: [220, 38, 38],
}

export const PDF_MARGIN_X = 18
export const PDF_FOOTER_H = 18
export const PDF_LOGO_WIDTH = 28
export const PDF_LOGO_HEIGHT = 4.5

export const IMPROVEMENT_REPORT_FILE_TYPE = 'application/pdf'
