import { type ZodType } from 'zod'

export type ApiResult<T> =
  { data: T; error: null } | { data: null; error: string }

interface FetcherInit<T> extends RequestInit {
  schema: ZodType<T>
}

export const apiFetch = async <T>(
  url: string,
  { schema, headers, ...init }: FetcherInit<T>,
): Promise<ApiResult<T>> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })

  if (!response.ok) {
    return { data: null, error: `Request failed: ${response.status}` }
  }

  const result = schema.safeParse(await response.json())

  if (!result.success) {
    return { data: null, error: 'Invalid response shape' }
  }

  return { data: result.data as T, error: null }
}
