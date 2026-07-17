import { AdminInvoicesTable } from '@features/subscriptions'
import {
  adminListInvoices,
  listCustomers,
} from '@features/subscriptions/queries'
import { type CustomerSelectOption } from '@features/subscriptions/types'

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
    <main
      className={`
        w-full px-10 py-8
        max-[900px]:p-5
      `}
    >
      <AdminInvoicesTable customers={customers} invoices={invoices} />
    </main>
  )
}
