import { env } from '@/env'

import { type StripeError } from './types'

const STRIPE_BASE_URL = 'https://api.stripe.com/v1'

// Stripe accepts form-urlencoded bodies; nested keys use `parent[child]`.
const encodeForm = (
  input: Record<string, string | number | undefined>,
): string => {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue
    params.append(key, String(value))
  }
  return params.toString()
}

export interface StripeFetchOptions {
  body?: Record<string, string | number | undefined>
  method?: 'GET' | 'POST'
}

export const stripeFetch = async <T>(
  path: string,
  options: StripeFetchOptions = {},
): Promise<T> => {
  const method = options.method ?? 'GET'
  const response = await fetch(`${STRIPE_BASE_URL}${path}`, {
    body: options.body ? encodeForm(options.body) : undefined,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method,
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as StripeError | null
    const message = payload?.error?.message ?? `Stripe ${response.status}`
    throw new Error(message)
  }

  return (await response.json()) as T
}
