import { z } from 'zod'

// The model is instructed to return JSON in these shapes. Fields are lenient
// (optional + defaulted) so a slightly-off model response still renders, matching
// legacy's untyped `slide.title || ''` usage.
export const InstagramResponseSchema = z.object({
  caption: z.string().optional().default(''),
  slides: z
    .array(
      z.object({
        body: z.string().optional().default(''),
        illustration_hint: z.string().optional(),
        title: z.string().optional().default(''),
      }),
    )
    .optional()
    .default([]),
})

export const SingleVisualResponseSchema = z.object({
  post: z.string().optional().default(''),
  visual: z
    .object({
      headline: z.string().optional().default(''),
      illustration_hint: z.string().optional(),
      subline: z.string().optional().default(''),
    })
    .optional()
    .default({ headline: '', subline: '' }),
})
