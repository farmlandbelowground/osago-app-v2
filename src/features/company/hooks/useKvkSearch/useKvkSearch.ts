import { useQuery } from '@tanstack/react-query'

import { searchKvkCompanies } from '@features/company/actions'
import { KVK_SEARCH_MIN_QUERY_LENGTH } from '@features/company/constants'
import { type KvkSearchResult } from '@features/company/schema'

import { type UseKvkSearch } from './types'

const fetchResults = async (query: string): Promise<KvkSearchResult[]> => {
  const result = await searchKvkCompanies(query)

  if (result.error !== null) {
    throw new Error(result.error)
  }

  return result.data
}

export const useKvkSearch: UseKvkSearch = ({ query }) => {
  const { data, isFetching } = useQuery({
    enabled: query.length >= KVK_SEARCH_MIN_QUERY_LENGTH,
    queryFn: () => fetchResults(query),
    queryKey: ['company', 'kvk-search', query],
    staleTime: 0,
  })

  return {
    isFetching,
    results: data ?? [],
  }
}
