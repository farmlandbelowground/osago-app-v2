export const SEND_TEMPLATE_ENDPOINT = '/api/email/send-template'
export const MAX_RECIPIENTS = 5
// Server caps total attachment base64 length at ~7 MB (≈5 MB raw) → 413.
export const ATTACHMENT_CAP_BYTES = 7 * 1024 * 1024
export const SEND_TEMPLATE_CONTEXT = 'client.deliverTemplatedEmail'
