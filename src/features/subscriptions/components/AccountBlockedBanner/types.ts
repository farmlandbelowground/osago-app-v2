import { type Invoice } from '../../schema'
import { type LockReason, type Subscription } from '../../types'

export interface Props {
  invoices: Invoice[]
  lockReason: LockReason
  subscription: Subscription | null
}
