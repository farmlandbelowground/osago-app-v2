import { type FC } from 'react'

import { formatDashboardDate } from '../../lib/format'
import { type Props } from './types'

export const AdminRecentCustomersTable: FC<Props> = ({ customers }) => {
  if (customers.length === 0) {
    return <p className="text-muted text-sm">Geen klanten</p>
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Naam</th>
          <th>Bedrijf</th>
          <th>Geregistreerd</th>
        </tr>
      </thead>
      <tbody>
        {customers.map(customer => (
          <tr key={customer.email}>
            <td>
              <strong>{customer.name}</strong>
              <div className="text-xs text-muted">{customer.email}</div>
            </td>
            <td>{customer.company}</td>
            <td className="text-muted">
              {formatDashboardDate(customer.createdAt)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
