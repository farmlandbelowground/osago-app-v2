import { z } from 'zod'

// { id, source, thumbUrl, fullUrl, credit } (osago-bundle.js:18627).
export const PresentationPhotoSchema = z.object({
  id: z.string(),
  source: z.enum(['upload', 'unsplash']),
  thumbUrl: z.string(),
  fullUrl: z.string(),
  credit: z.string().nullable(),
})

export const PresentationReviewSchema = z.object({
  status: z.enum(['submitted', 'approved']),
  submittedAt: z.number().optional(),
  approvedAt: z.number().optional(),
  approvedBy: z.string().optional(),
})

// The presentation feature's slice of `companies.extra` (spec §3.6). Passthrough
// so a read-modify-write merge never drops keys other features own.
export const PresentationExtraSchema = z
  .object({
    presentationFields: z.record(z.string(), z.string()).optional(),
    presentationImages: z
      .record(z.string(), z.array(PresentationPhotoSchema))
      .optional(),
    presentationTabsHidden: z.array(z.string()).optional(),
    presentationIncludeValuation: z.boolean().optional(),
    presentationReview: PresentationReviewSchema.optional(),
  })
  .passthrough()

// frozen `/api/unsplash/search` normalized response (search.js:46-52).
export const UnsplashSearchResponseSchema = z.object({
  results: z.array(
    z.object({
      id: z.string(),
      thumbUrl: z.string(),
      fullUrl: z.string(),
      credit: z.string(),
    }),
  ),
  total: z.number().optional(),
})
