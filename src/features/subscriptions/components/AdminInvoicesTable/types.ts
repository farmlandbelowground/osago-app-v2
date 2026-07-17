import { type Invoice } from '../../schema'
import { type CustomerSelectOption } from '../../types'

export interface Props {
  customers: CustomerSelectOption[]
  invoices: Invoice[]
}
