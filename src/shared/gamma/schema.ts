import { z } from 'zod'

// POST /api/gamma/generate → { generationId, status?, variant? } (generate.js:148).
export const GammaGenerateResponseSchema = z.object({
  generationId: z.string(),
  status: z.string().optional(),
  variant: z.string().optional(),
})

// GET /api/gamma/status?id= → Gamma's status + optional urls/error (status.js:40).
export const GammaStatusResponseSchema = z.object({
  status: z.string(),
  gammaUrl: z.string().nullable(),
  exportUrl: z.string().nullable(),
  error: z.string().nullable(),
})
