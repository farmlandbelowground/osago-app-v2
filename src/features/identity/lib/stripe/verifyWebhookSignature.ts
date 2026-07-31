import { createHmac, timingSafeEqual } from 'node:crypto'

// Stripe signs webhooks with HMAC-SHA256 over `${timestamp}.${payload}` and
// puts one or more signatures in the `Stripe-Signature` header:
//   t=1620000000,v1=<hex>,v1=<hex>
// We accept any `v1` match and reject if the timestamp is older than
// `toleranceSeconds` (default 5 min, per Stripe's guidance).
//
// Reference: docs.stripe.com/webhooks#verify-manually

const DEFAULT_TOLERANCE_SECONDS = 300

interface ParsedSignatureHeader {
  signatures: string[]
  timestamp: number
}

const parseHeader = (header: string): ParsedSignatureHeader | null => {
  let timestamp = Number.NaN
  const signatures: string[] = []
  for (const part of header.split(',')) {
    const [key, value] = part.split('=')
    if (key === 't') timestamp = Number(value)
    else if (key === 'v1' && value) signatures.push(value)
  }
  if (!Number.isFinite(timestamp) || signatures.length === 0) return null
  return { signatures, timestamp }
}

const constantTimeEqualsHex = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false
  const bufA = Buffer.from(a, 'hex')
  const bufB = Buffer.from(b, 'hex')
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export const verifyWebhookSignature = (
  payload: string,
  header: string | null,
  secret: string,
  toleranceSeconds: number = DEFAULT_TOLERANCE_SECONDS,
): boolean => {
  if (!header) return false
  const parsed = parseHeader(header)
  if (!parsed) return false
  const nowSeconds = Math.floor(Date.now() / 1000)
  if (Math.abs(nowSeconds - parsed.timestamp) > toleranceSeconds) return false

  const signedPayload = `${parsed.timestamp}.${payload}`
  const expected = createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex')

  return parsed.signatures.some(sig => constantTimeEqualsHex(sig, expected))
}
