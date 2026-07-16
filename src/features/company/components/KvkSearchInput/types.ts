import { type KvkSearchResult } from '@features/company/schema'

export interface Props {
  onSelect: (result: KvkSearchResult) => void
}
