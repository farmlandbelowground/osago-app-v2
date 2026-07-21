import { type KvkMergeableFields } from '@features/company/types'

export interface KvkBuyerSearchProps {
  onPrefill: (prefill: KvkMergeableFields) => void
}
