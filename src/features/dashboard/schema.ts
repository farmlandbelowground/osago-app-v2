import { z } from 'zod'

export const LeadPipelineStageSchema = z.enum([
  'new',
  'contact_made',
  'interest_confirmed',
  'negotiation',
  'closing',
  'no_interest',
])

export type LeadPipelineStage = z.infer<typeof LeadPipelineStageSchema>

export const LeadPipelineRowSchema = z.object({
  stage: LeadPipelineStageSchema,
})

export type LeadPipelineRow = z.infer<typeof LeadPipelineRowSchema>
