import { type z } from 'zod'

import { type GammaStatusResponseSchema } from './schema'

export type GammaVariant = 'memorandum' | 'teaser' | 'valuation'

export type GammaStatus = z.infer<typeof GammaStatusResponseSchema>

// The client-side phase machine the useGammaGeneration hook drives.
export type GammaPhase =
  'idle' | 'starting' | 'generating' | 'saving' | 'done' | 'error'

export interface GammaRunInput {
  description: string
  fileName: string
  inputText: string
  numCards: number
  variant: GammaVariant
}
