import { getServerClient } from '@shared/supabase/server'

import { DocumentRowSchema, type DocumentRow } from './schema'
import { type Document, type DocumentSource } from './types'

const rowToDocument = (row: DocumentRow): Document => ({
  description: row.description,
  fileName: row.file_name,
  filePath: row.file_path,
  fileSize: row.file_size,
  fileType: row.file_type,
  id: row.id,
  source: row.source,
  uploadedAt: row.uploaded_at,
  uploadedBy: row.uploaded_by,
  userId: row.user_id,
})

// Ports getUserDocuments (osago-bundle.js:6620-6626) — owner-scoped, one source
// section, newest first.
export const getUserDocuments = async (
  userId: string,
  source: DocumentSource,
): Promise<Document[]> => {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .eq('source', source)
    .order('uploaded_at', { ascending: false })

  if (error || !data) {
    return []
  }

  return data
    .map(row => DocumentRowSchema.safeParse(row))
    .filter(result => result.success)
    .map(result => rowToDocument(result.data))
}

// Join point for Slice 9's werkruimte-lock / valuation-PDF flags: does the user
// have any self-generated document whose file name starts with one of the given
// prefixes? Not wired to any specific flag in this slice (§1.1.4, §5 OQ-1).
export const documentExistsByPrefix = async (
  userId: string,
  prefixes: string[],
): Promise<boolean> => {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('documents')
    .select('file_name')
    .eq('user_id', userId)

  if (error || !data) {
    return false
  }

  return data.some(
    row =>
      typeof row.file_name === 'string' &&
      prefixes.some(prefix => row.file_name.startsWith(prefix)),
  )
}
