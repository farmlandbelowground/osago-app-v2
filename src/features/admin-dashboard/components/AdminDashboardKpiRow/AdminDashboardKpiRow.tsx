import { type FC } from 'react'

import { KpiTile } from '@shared/components/KpiTile'

import { KPI_ICON_SIZE as ICON_SIZE } from '../../constants'
import { formatDashboardMoney } from '../../lib/format'
import { type Props } from './types'

export const AdminDashboardKpiRow: FC<Props> = ({ metrics }) => {
  return (
    <div className="grid-4 mb-5 grid">
      <KpiTile
        icon={
          <svg
            fill="none"
            height={ICON_SIZE}
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width={ICON_SIZE}
          >
            <path d="M4 10h12" />
            <path d="M4 14h9" />
            <path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2" />
          </svg>
        }
        label="Omzet"
        meta={`${metrics.paidCount} betaalde ${
          metrics.paidCount === 1 ? 'factuur' : 'facturen'
        }`}
        value={formatDashboardMoney(metrics.omzet)}
      />
      <KpiTile
        icon={
          <svg
            fill="none"
            height={ICON_SIZE}
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width={ICON_SIZE}
          >
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        }
        label="Lopende abonnementen"
        meta="Active, ending of renewed"
        value={String(metrics.lopendeCount)}
      />
      <KpiTile
        icon={
          <svg
            fill="none"
            height={ICON_SIZE}
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width={ICON_SIZE}
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" x2="19" y1="8" y2="14" />
            <line x1="22" x2="16" y1="11" y2="11" />
          </svg>
        }
        label="Nieuwe gebruikers"
        meta={`${metrics.totalUsers} totaal`}
        value={String(metrics.nieuweCount)}
      />
      <KpiTile
        icon={
          <svg
            fill="none"
            height={ICON_SIZE}
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width={ICON_SIZE}
          >
            <rect height="14" rx="2" width="20" x="2" y="5" />
            <line x1="2" x2="22" y1="10" y2="10" />
          </svg>
        }
        label="Openstaande facturen"
        meta={`${metrics.openCount} ${
          metrics.openCount === 1 ? 'factuur' : 'facturen'
        }`}
        value={formatDashboardMoney(metrics.openstaand)}
      />
    </div>
  )
}
