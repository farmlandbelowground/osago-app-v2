import { type GammaPhase, type GammaRunInput } from '../types'

export interface Result {
  elapsedSeconds: number
  error: string | null
  phase: GammaPhase
  reset: () => void
  run: (input: GammaRunInput) => Promise<void>
  storedDocumentId: string | null
}

export type UseGammaGeneration = () => Result
