import { z } from 'zod'

// documents table (schema.sql:283-294 + migration 0007: id is text `doc_…`).
export const DocumentRowSchema = z.object({
  id: z.string(),
  user_id: z.uuid(),
  file_name: z.string(),
  file_type: z.string(),
  file_size: z.number().nullable(),
  file_path: z.string().nullable(),
  description: z.string().nullable(),
  source: z.enum(['admin', 'self-generated']),
  uploaded_at: z.string(),
  uploaded_by: z.uuid().nullable(),
})

export type DocumentRow = z.infer<typeof DocumentRowSchema>
