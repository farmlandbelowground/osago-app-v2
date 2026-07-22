export interface TemplatedEmailAttachment {
  content?: string
  dataUrl?: string
  fileName?: string
}

export interface SendTemplatedEmailOptions {
  attachments?: TemplatedEmailAttachment[]
  bcc?: string | string[]
  context?: string
  related?: Record<string, string>
}

export interface SendTemplatedEmailResult {
  error: string | null
  ok: boolean
  skipped: boolean
}
