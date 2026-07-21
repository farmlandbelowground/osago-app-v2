'use server'

import { revalidatePath } from 'next/cache'

import { type ApiResult } from '@shared/api/fetcher'
import { requireSession } from '@shared/auth/session'
import { getServerClient } from '@shared/supabase/server'

import { DOCUMENTENKLUIS_PATH } from './constants/routes'
import {
  DEFAULT_CONTENT_TYPE,
  DEFAULT_FILE_EXTENSION,
  DOCS_BUCKET,
  SIGNED_URL_TTL_SECONDS,
} from './constants/storage'

// Ports the extension derivation in uploadDocument (osago-data.js:960-962).
const deriveExtension = (fileName: string): string => {
  const dotIndex = fileName.lastIndexOf('.')
  if (dotIndex < 0) {
    return DEFAULT_FILE_EXTENSION
  }
  const raw = fileName
    .slice(dotIndex + 1)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  return raw || DEFAULT_FILE_EXTENSION
}

export interface LogSelfGeneratedDocumentInput {
  fileBase64: string
  fileName: string
  fileType: string
  description?: string
}

// Ports logSelfGeneratedDocument (osago-bundle.js:6636-6691) minus the dropped
// localStorage/quota-pruning path (§1.2, §3.6): upload the bytes to Storage at
// `<user_id>/<doc_id>.<ext>`, then insert the documents metadata row. Imported
// by features/leads (sales docs) and features/valuation (jaarstukken upload).
export const logSelfGeneratedDocument = async (
  input: LogSelfGeneratedDocumentInput,
): Promise<ApiResult<{ id: string }>> => {
  const session = await requireSession()
  const userId = session.user.id
  const supabase = await getServerClient()

  const id = `doc_${crypto.randomUUID()}`
  const extension = deriveExtension(input.fileName)
  const path = `${userId}/${id}.${extension}`
  const bytes = Buffer.from(input.fileBase64, 'base64')

  const { error: uploadError } = await supabase.storage
    .from(DOCS_BUCKET)
    .upload(path, bytes, {
      contentType: input.fileType || DEFAULT_CONTENT_TYPE,
      upsert: true,
    })

  if (uploadError) {
    return { data: null, error: 'Uploaden naar de Documentenkluis is mislukt.' }
  }

  const { error: insertError } = await supabase.from('documents').insert({
    description: input.description ?? null,
    file_name: input.fileName,
    file_path: path,
    file_size: bytes.length,
    file_type: input.fileType || DEFAULT_CONTENT_TYPE,
    id,
    source: 'self-generated',
    uploaded_by: userId,
    user_id: userId,
  })

  if (insertError) {
    return { data: null, error: 'Opslaan in de Documentenkluis is mislukt.' }
  }

  revalidatePath(DOCUMENTENKLUIS_PATH)
  return { data: { id }, error: null }
}

// Fresh 300s signed URL for a download (ports downloadDocument's Storage branch
// + getDocumentSignedUrl, osago-bundle.js:6704-6709 / osago-data.js:976-984).
// Invoked imperatively from the client on click — never rendered ahead of time.
export const createDocumentDownloadUrl = async (
  id: string,
): Promise<ApiResult<{ url: string }>> => {
  const session = await requireSession()
  const supabase = await getServerClient()

  const { data: row, error: rowError } = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .maybeSingle()

  if (rowError || !row?.file_path) {
    return { data: null, error: 'Bestand niet beschikbaar.' }
  }

  const { data, error } = await supabase.storage
    .from(DOCS_BUCKET)
    .createSignedUrl(row.file_path, SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) {
    return { data: null, error: 'Download mislukt.' }
  }

  return { data: { url: data.signedUrl }, error: null }
}
