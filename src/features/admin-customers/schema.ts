import { z } from 'zod'

import { PASSWORD_MIN_LENGTH } from './constants'

export const CreateCustomerSchema = z.object({
  email: z.email('Vul een geldig e-mailadres in.'),
  firstName: z.string().min(1, 'Voornaam is verplicht.'),
  lastName: z.string().min(1, 'Achternaam is verplicht.'),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, 'Wachtwoord moet minimaal 8 tekens zijn.'),
  phone: z.string().min(1, 'Telefoonnummer is verplicht.'),
})

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>

export const SignupResponseSchema = z.object({
  error: z.string().optional(),
  ok: z.boolean().optional(),
  userId: z.string().optional(),
})

export const UploadDocumentSchema = z.object({
  dataUrl: z.string().min(1),
  description: z.string(),
  fileName: z.string().min(1),
  fileSize: z.number(),
  fileType: z.string(),
  userId: z.string().min(1),
})

export type UploadDocumentInput = z.infer<typeof UploadDocumentSchema>

export const AddBuyerSchema = z.object({
  contactEmail: z.string(),
  contactFirstName: z.string(),
  contactLastName: z.string(),
  contactPhone: z.string(),
  name: z.string().min(1, 'Naam is verplicht.'),
  source: z.string(),
  targetUserId: z.string().min(1),
  type: z.string(),
})

export type AddBuyerInput = z.infer<typeof AddBuyerSchema>
