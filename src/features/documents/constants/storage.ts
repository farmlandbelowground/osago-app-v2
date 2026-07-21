// Private Supabase Storage bucket + path convention (schema.sql migration 0007).
// Files live at `<user_id>/<document_id>.<ext>`; downloads go through a
// short-lived signed URL (legacy getDocumentSignedUrl, osago-data.js:976-984).
export const DOCS_BUCKET = 'osago-documents'
export const SIGNED_URL_TTL_SECONDS = 300

export const DEFAULT_FILE_EXTENSION = 'bin'
export const DEFAULT_CONTENT_TYPE = 'application/octet-stream'

// formatFileSize thresholds (ports osago-bundle.js:6751-6756).
export const BYTES_PER_UNIT = 1024
export const FILE_SIZE_DECIMALS = 1
