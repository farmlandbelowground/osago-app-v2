import { type LockReason } from '@features/subscriptions/types'

export interface Props {
  allowedPaths: string[] | null
  lockReason: LockReason
}
