import { type UnsplashSearchResult } from '../../types'

export interface Args {
  query: string
}

export interface Result {
  errorMessage: string | null
  isFetching: boolean
  results: UnsplashSearchResult[]
}

export type UseUnsplashSearch = (args: Args) => Result
