import { z } from 'zod'

import { AvailabilitySchema } from '@shared/types/availability'

export const StaffProfileRowSchema = z.object({
  // profiles.active is NOT NULL default true; nullable here for defensive parsing.
  active: z.boolean().nullable(),
  // Malformed stored availability falls back to null rather than dropping the
  // whole staff row from the list.
  availability: AvailabilitySchema.nullable().catch(null),
  created_at: z.string().nullable(),
  email: z.string(),
  first_name: z.string().nullable(),
  id: z.string(),
  last_name: z.string().nullable(),
  phone: z.string().nullable(),
  photo: z.string().nullable(),
  role: z.enum(['admin', 'admin_user', 'customer']),
})

// Shared shape for create/edit — mirrors StaffMemberFormData. password is
// required on create; on edit an empty string means "leave unchanged".
export const StaffInputSchema = z.object({
  active: z.boolean(),
  email: z.email('Vul een geldig e-mailadres in.'),
  firstName: z.string().min(1, 'Voornaam is verplicht.'),
  lastName: z.string().min(1, 'Achternaam is verplicht.'),
  password: z.string(),
  phone: z.string(),
  photo: z.string().nullable(),
  role: z.enum(['admin', 'user']),
})

export const CreateStaffResponseSchema = z.object({
  email: z.string().optional(),
  error: z.string().optional(),
  ok: z.boolean().optional(),
  role: z.string().optional(),
  userId: z.string().optional(),
})

export const UpdateUserResponseSchema = z.object({
  error: z.string().optional(),
  ok: z.boolean().optional(),
})
