import { useQuery } from '@tanstack/react-query'

import { searchUnsplash } from '../../actions'
import { UNSPLASH_SEARCH_MIN_QUERY_LENGTH } from '../../constants/presentation'
import { type UnsplashSearchResult } from '../../types'
import { type UseUnsplashSearch } from './types'

const fetchResults = async (query: string): Promise<UnsplashSearchResult[]> => {
  const result = await searchUnsplash(query)

  if (result.error !== null) {
    throw new Error(result.error)
  }

  return result.data
}

// Client-reactive Unsplash search over the submitted query term (spec §3.5).
// The picker feeds the term on submit (button / Enter), matching legacy's
// runUnsplashSearch (osago-bundle.js:18774).
export const useUnsplashSearch: UseUnsplashSearch = ({ query }) => {
  const { data, error, isError, isFetching } = useQuery({
    enabled: query.length >= UNSPLASH_SEARCH_MIN_QUERY_LENGTH,
    queryFn: () => fetchResults(query),
    queryKey: ['presentation', 'unsplash', query],
    staleTime: 0,
  })

  return {
    errorMessage: isError ? (error as Error).message : null,
    isFetching,
    results: data ?? [],
  }
}
