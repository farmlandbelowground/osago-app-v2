import { type ZodType } from 'zod'

export type ApiResult<T> =
  { data: T; error: null } | { data: null; error: string }

export interface ApiErrorShape {
  error: { message: string }
}

interface FetcherInit<T> extends RequestInit {
  schema: ZodType<T>
  errorSchema?: ZodType<ApiErrorShape>
}

export const apiFetch = async <T>(
  url: string,
  { schema, errorSchema, headers, ...init }: FetcherInit<T>,
): Promise<ApiResult<T>> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })

  if (!response.ok) {
    if (errorSchema) {
      try {
        const parsed = errorSchema.safeParse(await response.json())
        if (parsed.success) {
          return { data: null, error: parsed.data.error.message }
        }
      } catch {
        // Fall through to the generic status error below.
      }
    }

    return { data: null, error: `Request failed: ${response.status}` }
  }

  const result = schema.safeParse(await response.json())

  if (!result.success) {
    return { data: null, error: 'Invalid response shape' }
  }

  return { data: result.data as T, error: null }
}
