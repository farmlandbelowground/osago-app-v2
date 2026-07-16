import { type KvkSearchResult } from '@features/company/schema'

export interface Props {
  activeIndex: number
  onSelect: (result: KvkSearchResult) => void
  query: string
  results: KvkSearchResult[]
}
