import { type ZodType } from 'zod'

import { env } from '@/env'

import { apiFetch, type ApiResult } from './fetcher'

const resolveAccessToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') {
    const { getServerClient } = await import('@shared/supabase/server')
    const supabase = await getServerClient()
    const { data } = await supabase.auth.getSession()

    return data.session?.access_token ?? null
  }

  const { getBrowserClient } = await import('@shared/supabase/browser')
  const { data } = await getBrowserClient().auth.getSession()

  return data.session?.access_token ?? null
}

const resolveUrl = (path: string): string => {
  if (path.startsWith('http') || typeof window !== 'undefined') {
    return path
  }

  return `${env.APP_URL}${path}`
}

interface LegacyFetcherInit<T> extends RequestInit {
  schema: ZodType<T>
}

export const legacyApiFetch = async <T>(
  path: string,
  { headers, ...init }: LegacyFetcherInit<T>,
): Promise<ApiResult<T>> => {
  const accessToken = await resolveAccessToken()

  return apiFetch<T>(resolveUrl(path), {
    ...init,
    headers: {
      ...headers,
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
  })
}
