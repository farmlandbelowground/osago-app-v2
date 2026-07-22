import { z } from 'zod'

import { type Partner } from './types'

// ─── Supabase row schema (snake_case, frozen migration 0006_partners.sql) ────

export const PartnerRowSchema = z.object({
  active: z.boolean(),
  contact_email: z.string().nullable(),
  contact_person: z.string().nullable(),
  contact_phone: z.string().nullable(),
  created_at: z.iso.datetime({ offset: true }),
  created_by: z.string().nullable(),
  description: z.string().nullable(),
  id: z.string(),
  logo: z.string().nullable(),
  name: z.string(),
  slug: z.string(),
  updated_at: z.iso.datetime({ offset: true }),
  voucher_id: z.string().nullable(),
})

export type PartnerRow = z.infer<typeof PartnerRowSchema>

export const rowToPartner = (row: PartnerRow): Partner => ({
  active: row.active,
  contactEmail: row.contact_email ?? '',
  contactPerson: row.contact_person ?? '',
  contactPhone: row.contact_phone ?? '',
  createdAt: row.created_at,
  createdBy: row.created_by,
  description: row.description ?? '',
  id: row.id,
  logo: row.logo,
  name: row.name,
  slug: row.slug,
  voucherId: row.voucher_id,
})

// ─── Admin form / action input schema (camelCase, single source of truth) ────
// Bounds are verbatim from legacy savePartner (osago-bundle.js:26569):
// name required; slug derived from name when empty then pattern-checked; the
// contact email is validated only when non-empty.

export const AdminPartnerFormSchema = z.object({
  active: z.boolean(),
  contactEmail: z
    .union([
      z.literal(''),
      z.email('Vul een geldig contact-emailadres in (of laat het leeg).'),
    ])
    .optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  description: z.string().optional(),
  id: z.string().optional(),
  logo: z.string().optional(),
  name: z.string().min(1, 'Vul een naam in voor de partner.'),
  slug: z
    .string()
    .regex(
      /^[a-z0-9-]+$/,
      'Slug mag alleen kleine letters, cijfers en streepjes bevatten.',
    )
    .optional(),
  voucherId: z.string().nullable().optional(),
})

export type PartnerFormInput = z.infer<typeof AdminPartnerFormSchema>
