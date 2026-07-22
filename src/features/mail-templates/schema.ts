import { z } from 'zod'

import { DEFAULT_FROM_EMAIL, DEFAULT_FROM_NAME } from './constants'

export const EmailTemplateVarSchema = z.object({
  name: z.string(),
  sample: z.string(),
})

// The app_config.emailTemplates catalog shape (osago-bundle.js DEFAULT_EMAIL_
// TEMPLATES). The viewer reads this verbatim; it never writes.
export const EmailTemplateSchema = z.object({
  availableVars: z.array(EmailTemplateVarSchema).default([]),
  bcc: z.string().optional(),
  body: z.string(),
  category: z.string(),
  description: z.string().default(''),
  enabled: z.boolean(),
  fromEmail: z.string().default(DEFAULT_FROM_EMAIL),
  fromName: z.string().default(DEFAULT_FROM_NAME),
  id: z.string(),
  name: z.string(),
  subject: z.string(),
})

export const EmailTemplatesArraySchema = z.array(EmailTemplateSchema)

export type EmailTemplate = z.infer<typeof EmailTemplateSchema>
