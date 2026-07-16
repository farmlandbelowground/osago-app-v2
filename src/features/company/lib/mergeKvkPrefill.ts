import { type KvkMergeableFields, type MergeKvkPrefillResult } from '../types'

const isEmpty = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  value === '' ||
  (typeof value === 'number' && Number.isNaN(value))

const assign = <TKey extends keyof KvkMergeableFields>(
  target: KvkMergeableFields,
  key: TKey,
  value: KvkMergeableFields[TKey],
): void => {
  target[key] = value
}

// Typed equivalent of legacy's selectKvkResult merge step
// (osago-bundle.js:8400-8412). When overwrite is declined, a key is only
// set from `prefill` if `existing` was empty — already-filled keys are left
// untouched either way. `kvkPrefilled` records every key that ends up set
// from KVK under either branch.
export const mergeKvkPrefill = (
  existing: KvkMergeableFields,
  prefill: KvkMergeableFields,
  overwrite: boolean,
): MergeKvkPrefillResult => {
  const merged: KvkMergeableFields = { ...existing }
  const kvkPrefilled: string[] = []

  ;(Object.keys(prefill) as (keyof KvkMergeableFields)[]).forEach(key => {
    const value = prefill[key]

    if (isEmpty(value)) {
      return
    }

    if (!overwrite && !isEmpty(existing[key])) {
      return
    }

    assign(merged, key, value)
    kvkPrefilled.push(key)
  })

  return { kvkPrefilled, merged }
}
