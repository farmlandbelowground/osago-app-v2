import { type KvkSearchResult } from '@features/company/schema'

export interface Args {
  query: string
}

export interface Result {
  isFetching: boolean
  results: KvkSearchResult[]
}

export type UseKvkSearch = (args: Args) => Result
