export type DocumentSource = 'admin' | 'self-generated'

export interface Document {
  description: string | null
  fileName: string
  filePath: string | null
  fileSize: number | null
  fileType: string
  id: string
  source: DocumentSource
  uploadedAt: string
  uploadedBy: string | null
  userId: string
}

export interface FileIconMeta {
  color: string
  label: string
}
