import { type Metadata } from 'next'

import { AdminInvoicesTable } from '@features/subscriptions'
import {
  adminListInvoices,
  listCustomers,
} from '@features/subscriptions/queries'
import { type CustomerSelectOption } from '@features/subscriptions/types'

export const metadata: Metadata = {
  title: 'Facturatie',
}

export default async function AdminFacturenPage() {
  const [invoices, customerOptions] = await Promise.all([
    adminListInvoices(),
    listCustomers(),
  ])

  const customers: CustomerSelectOption[] = customerOptions.map(customer => ({
    label: `${
      [customer.firstName, customer.lastName].filter(Boolean).join(' ') ||
      customer.email
    } — ${customer.email}`,
    userId: customer.userId,
  }))

  return (
    <main className="main">
      <AdminInvoicesTable customers={customers} invoices={invoices} />
    </main>
  )
}
