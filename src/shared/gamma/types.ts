import { type z } from 'zod'

import { type GammaStatusResponseSchema } from './schema'

export type GammaVariant = 'memorandum' | 'teaser' | 'valuation'

export type GammaStatus = z.infer<typeof GammaStatusResponseSchema>

// The client-side phase machine the useGammaGeneration hook drives.
export type GammaPhase =
  'idle' | 'starting' | 'generating' | 'saving' | 'done' | 'error'

// Fixed-template generate params sent to /api/gamma/generate (ports the #65/#70
// request body of generateViaGamma / generateValuationViaGamma). Omitted → the
// legacy pptx / pexels behavior; present → the fixed-template PDF flow.
export interface GammaGenerateOptions {
  exportAs: 'pdf' | 'pptx'
  cardSplit?: 'auto' | 'inputTextBreaks'
  fixedTemplate?: boolean
  imageSource?: string
  reserveRightHalf?: boolean
  themeId?: string
}

// A fractional page rectangle (0..1), y measured from the TOP — matches the
// legacy placement rects and injectImagesIntoPdf coordinate system.
export interface GammaRect {
  h: number
  w: number
  x: number
  y: number
}

// Where a photo comes from. Kept as a lightweight descriptor (not bytes/URLs):
// uploaded photos are stored as multi-MB base64 data URLs in the DB, which would
// blow the server-action body limit — finalizeGammaDocument resolves the bytes
// server-side from the descriptor. `tab` → first photo of a presentation tab
// (incl. the 'waarderingsrapport' hero); `profile` → the account photo.
export type GammaPhotoSource = { profile: true } | { tab: string }

export interface GammaPhotoPlacement {
  rect: GammaRect
  slide: number
  source: GammaPhotoSource
}

// The value-slider gauge; recoloured per brand (osago green / take5 purple).
export interface GammaGaugeSpec {
  high: number
  kind: 'gauge'
  low: number
  merk: 'osago' | 'take5'
  mid: number
  title: string
}

// The slecht→matig→goed value-driver bars. The gradient stays semantic
// (red→amber→green) for both brands — never recoloured (spec §13.7).
export interface GammaValueDriversSpec {
  kind: 'valuedrivers'
  scores: { score: number; title: string }[]
}

export type GammaComponentSpec = GammaGaugeSpec | GammaValueDriversSpec

export interface GammaComponentPlacement {
  rect: GammaRect
  slide: number
  spec: GammaComponentSpec
}

// The server-side injection plan: photos placed as fixed overlays in the
// reserved column, components measured into the page (never overlapping text).
export interface GammaPlacementPlan {
  components: GammaComponentPlacement[]
  photos: GammaPhotoPlacement[]
  pageBg?: [number, number, number]
}

export interface GammaRunInput {
  description: string
  fileName: string
  inputText: string
  numCards: number
  variant: GammaVariant
  fileType?: string
  options?: GammaGenerateOptions
  placementPlan?: GammaPlacementPlan
}
