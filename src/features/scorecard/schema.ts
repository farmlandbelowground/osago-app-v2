import { z } from 'zod'

export const ScorecardAnswerIdSchema = z.enum([
  'volledig',
  'grotendeels',
  'gedeeltelijk',
  'niet',
  'nvt',
])

export type ScorecardAnswerId = z.infer<typeof ScorecardAnswerIdSchema>

// `.passthrough()` preserves the removed-from-UI `notes` field (and any other
// sibling keys) so read-modify-write of one answer never drops it
// (osago-bundle.js:7595-7597; spec §3.3/OQ-6).
export const ScorecardAnswerStateSchema = z
  .object({
    answer: ScorecardAnswerIdSchema.optional(),
    notes: z.string().optional(),
  })
  .passthrough()

export type ScorecardAnswerState = z.infer<typeof ScorecardAnswerStateSchema>

export const ScorecardStateSchema = z.record(
  z.string(),
  ScorecardAnswerStateSchema,
)

export type ScorecardState = z.infer<typeof ScorecardStateSchema>

// `.passthrough()` is load-bearing: the read must tolerate every other feature's
// `extra` keys and the write must never drop them (spec §3.3).
export const CompanyScorecardExtraSchema = z
  .object({
    employees: z.number().nullable().optional(),
    scorecard: ScorecardStateSchema.optional(),
  })
  .passthrough()

export type CompanyScorecardExtra = z.infer<typeof CompanyScorecardExtraSchema>

export const CompanyScorecardRowSchema = z.object({
  extra: CompanyScorecardExtraSchema,
  legal_form: z.string().nullable(),
  name: z.string().nullable(),
  sector: z.string().nullable(),
  user_id: z.string(),
})

export type CompanyScorecardRow = z.infer<typeof CompanyScorecardRowSchema>
