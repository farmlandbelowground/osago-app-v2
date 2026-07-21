import { z } from 'zod'

export const LeadStageSchema = z.enum([
  'new',
  'contact_made',
  'interest_confirmed',
  'negotiation',
  'closing',
  'no_interest',
])

export const LeadTypeSchema = z.enum([
  'pipeline',
  'manual',
  'osago_validated',
  'auto_identified',
])

// leads table (schema.sql:155-208 + migration 0002: website/source).
export const LeadRowSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  lead_type: LeadTypeSchema,
  stage: LeadStageSchema.nullable(),
  name: z.string().nullable(),
  type: z.string().nullable(),
  fit_score: z.number().nullable(),
  contact_first_name: z.string().nullable(),
  contact_last_name: z.string().nullable(),
  contact_email: z.string().nullable(),
  contact_phone: z.string().nullable(),
  contact_legacy: z.string().nullable(),
  street: z.string().nullable(),
  house_number: z.string().nullable(),
  house_number_addition: z.string().nullable(),
  postal_code: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string().nullable(),
  location: z.string().nullable(),
  notes: z.string().nullable(),
  website: z.string().nullable(),
  source: z.string().nullable(),
  added_at: z.string(),
  validated_by_osago: z.boolean(),
  validated_by: z.uuid().nullable(),
  validated_at: z.string().nullable(),
  added_manually: z.boolean(),
  validation_status: z.enum(['pending_validation', 'validated']).nullable(),
  validation_paid_at: z.string().nullable(),
  validation_fee: z.number().nullable(),
  promoted_to_pipeline: z.boolean(),
  promoted_at: z.string().nullable(),
  promoted_from_manual_at: z.string().nullable(),
  promoted_from_osago_lead_at: z.string().nullable(),
})

export type LeadRow = z.infer<typeof LeadRowSchema>

// Narrow projection for the dashboard buyer-KPI counts (moved from
// features/dashboard, spec §3.8).
export const LeadStageRowSchema = z.object({ stage: LeadStageSchema })

// /api/leads/identify — validate only what we consume (§3.2). The handler may
// add fields; we ignore them.
export const IdentifiedBuyerSchema = z.object({
  name: z.string(),
  type: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  rationale: z.string().optional(),
  fitScore: z.number().optional(),
})

export const IdentifyResponseSchema = z.object({
  leads: z.array(IdentifiedBuyerSchema),
  note: z.string().optional(),
  meta: z
    .object({ queriesRun: z.number(), resultsAnalysed: z.number() })
    .partial()
    .optional(),
})

// The endpoint's error body is a flat `{ error: string }` (schema.sql §3.2:
// 400/500/502). Adapt it to the shared ApiErrorShape (`{ error: { message } }`)
// via a transform so legacyApiFetch's errorSchema path surfaces the real Dutch
// message — matching legacy's `data.error` toast (osago-bundle.js:21185).
export const IdentifyErrorSchema = z
  .object({ error: z.string() })
  .transform(value => ({ error: { message: value.error } }))

// Mollie lead-validation checkout response (create.js).
export const LeadValidationPaymentSchema = z.object({
  paymentUrl: z.string(),
})

// Manual add-buyer form (osago-bundle.js:23646-23654): require a company name OR
// a full contact name.
export const ManualLeadFormSchema = z
  .object({
    name: z.string(),
    type: z.string(),
    contactFirstName: z.string(),
    contactLastName: z.string(),
    contactEmail: z.string(),
    contactPhone: z.string(),
    street: z.string(),
    houseNumber: z.string(),
    houseNumberAddition: z.string(),
    postalCode: z.string(),
    city: z.string(),
    country: z.string(),
    notes: z.string(),
  })
  .superRefine((value, ctx) => {
    const hasContactName =
      value.contactFirstName.trim() && value.contactLastName.trim()
    if (!value.name.trim() && !hasContactName) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Vul een bedrijfsnaam in, of een voor- en achternaam van de contactpersoon.',
        path: ['name'],
      })
    }
  })
