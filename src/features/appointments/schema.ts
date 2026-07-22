import { z } from 'zod'

import {
  ADVANCE_MAX,
  ADVANCE_MIN,
  BUFFER_MAX,
  BUFFER_MIN,
  DURATION_MAX,
  DURATION_MIN,
  ROLLING_MAX,
  ROLLING_MIN,
} from './constants'

// ─── Supabase row schemas (snake_case, frozen migrations 0003 + 0011) ───────

export const AppointmentTypeRowSchema = z.object({
  active: z.boolean(),
  advance_notice_min: z.number().int(),
  assigned_admin_ids: z.array(z.string()),
  buffer_after: z.number().int(),
  color: z.string().nullable(),
  created_at: z.iso.datetime({ offset: true }),
  created_by: z.string().nullable(),
  description: z.string().nullable(),
  duration: z.number().int(),
  id: z.string(),
  location: z.string().nullable(),
  location_details: z.string().nullable(),
  name: z.string(),
  rolling_days: z.number().int(),
  slug: z.string(),
  updated_at: z.iso.datetime({ offset: true }),
})

export const AppointmentBookingRowSchema = z.object({
  admin_id: z.string().nullable(),
  appointment_type_id: z.string().nullable(),
  cancelled_at: z.iso.datetime({ offset: true }).nullable(),
  cancelled_by: z.string().nullable(),
  created_at: z.iso.datetime({ offset: true }),
  ends_at: z.iso.datetime({ offset: true }).nullable(),
  guest_email: z.string().nullable(),
  guest_first_name: z.string().nullable(),
  guest_last_name: z.string().nullable(),
  guest_name: z.string().nullable(),
  guest_phone: z.string().nullable(),
  id: z.string(),
  notes: z.string().nullable(),
  starts_at: z.iso.datetime({ offset: true }).nullable(),
  status: z.string(),
  user_id: z.uuid().nullable(),
})

export const ExistingBookingRowSchema = z.object({
  admin_id: z.string().nullable(),
  ends_at: z.iso.datetime({ offset: true }).nullable(),
  starts_at: z.iso.datetime({ offset: true }).nullable(),
  status: z.string(),
})

export const AdvisorProfileRowSchema = z.object({
  email: z.string().nullable(),
  first_name: z.string().nullable(),
  id: z.string(),
  last_name: z.string().nullable(),
  phone: z.string().nullable(),
})

export const MedewerkerRowSchema = z.object({
  email: z.string().nullable(),
  first_name: z.string().nullable(),
  id: z.string(),
  last_name: z.string().nullable(),
  role: z.string(),
})

// ─── Form / action input schemas (camelCase, single source of truth) ────────

export const BookingFormSchema = z.object({
  email: z.email('Vul een geldig e-mailadres in.'),
  firstName: z.string().min(1, 'Vul jouw voornaam in.'),
  lastName: z.string().min(1, 'Vul jouw achternaam in.'),
  notes: z.string().min(1, 'Vul een korte toelichting in.'),
  phone: z.string().min(1, 'Vul jouw telefoonnummer in.'),
  preferredAdminId: z.string().optional(),
  startsAt: z.number().int(),
  // The bot-check is enforced by createBooking's server-side verifyTurnstileToken
  // (strict in prod; fail-open when the verify endpoint/secret is absent, exactly
  // as login/register). Hard-requiring the token here would pre-empt that fail-open
  // path — the legacy demo-mode behaviour that lets the flow run when the bot-check
  // is not enforced.
  turnstileToken: z.string(),
  typeSlug: z.string().min(1),
})

export const BookingDetailsFormSchema = BookingFormSchema.pick({
  email: true,
  firstName: true,
  lastName: true,
  notes: true,
  phone: true,
})

export const AdminTypeFormSchema = z.object({
  active: z.boolean(),
  advanceNoticeMin: z.number().int().min(ADVANCE_MIN).max(ADVANCE_MAX),
  assignedAdminIds: z
    .array(z.string())
    .min(1, 'Koppel minstens één medewerker.'),
  bufferAfter: z.number().int().min(BUFFER_MIN).max(BUFFER_MAX),
  color: z.string(),
  description: z.string().optional(),
  duration: z.number().int().min(DURATION_MIN).max(DURATION_MAX),
  id: z.string().optional(),
  location: z.enum(['video', 'phone', 'office']),
  locationDetails: z.string().optional(),
  name: z.string().min(1, 'Vul een naam in.'),
  rollingDays: z.number().int().min(ROLLING_MIN).max(ROLLING_MAX),
  slug: z.string().optional(),
})

// ─── Frozen endpoint response contract (/api/email/send-template) ───────────

export const SendTemplateResponseSchema = z.object({
  error: z.string().optional(),
  id: z.string().optional(),
  ok: z.boolean(),
  reason: z.string().optional(),
  simulated: z.boolean().optional(),
  skipped: z.boolean().optional(),
})

export type AppointmentTypeRow = z.infer<typeof AppointmentTypeRowSchema>
export type AppointmentBookingRow = z.infer<typeof AppointmentBookingRowSchema>
export type ExistingBookingRow = z.infer<typeof ExistingBookingRowSchema>
export type AdvisorProfileRow = z.infer<typeof AdvisorProfileRowSchema>
export type BookingFormInput = z.infer<typeof BookingFormSchema>
export type BookingDetailsFormInput = z.infer<typeof BookingDetailsFormSchema>
export type AdminTypeFormInput = z.infer<typeof AdminTypeFormSchema>
