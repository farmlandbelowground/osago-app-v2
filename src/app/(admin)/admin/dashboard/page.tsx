import {
  AdminDashboardKpiRow,
  AdminDashboardPeriodFilter,
  AdminRecentCustomersTable,
  AdminSubscriptionDonut,
  AdminSubscriptionSplitBar,
  computeDashboardMetrics,
  DASHBOARD_PRESETS,
  describeDashboardRange,
  getAdminDashboardData,
  resolveDashboardRange,
  type DashboardFilter,
  type DashboardPreset,
} from '@features/admin-dashboard'
import { requireRole } from '@shared/auth/guards'

interface Props {
  searchParams: Promise<{ from?: string; preset?: string; to?: string }>
}

export default async function AdminDashboardPage({ searchParams }: Props) {
  await requireRole('admin_user')

  const params = await searchParams
  const preset: DashboardPreset = (
    DASHBOARD_PRESETS as readonly string[]
  ).includes(params.preset ?? '')
    ? (params.preset as DashboardPreset)
    : 'all'

  const filter: DashboardFilter = {
    from: params.from ?? null,
    preset,
    to: params.to ?? null,
  }

  const range = resolveDashboardRange(filter)
  const data = await getAdminDashboardData()
  const metrics = computeDashboardMetrics(data, range, preset)

  return (
    <main className="main">
      <div className="page-header">
        <div>
          <h1 className="page-title">Beheerpaneel</h1>
        </div>
      </div>

      <AdminDashboardPeriodFilter
        filter={filter}
        rangeLabel={describeDashboardRange(filter, range)}
      />

      <AdminDashboardKpiRow metrics={metrics} />

      <div className="grid-2 mb-5 grid">
        <div className="card">
          <h3 style={{ margin: '0 0 4px' }}>
            Verhouding lopende abonnementen
          </h3>
          <p className="desc" style={{ marginBottom: 14 }}>
            Verdeling tussen volledige verkoopabonnementen en
            alleen-waardebepaling.
          </p>
          <AdminSubscriptionDonut
            verkoopCount={metrics.verkoopCount}
            waardeCount={metrics.waardeCount}
          />
        </div>

        <div className="card">
          <h3 style={{ margin: '0 0 4px' }}>
            Gebruikers met / zonder lopend abonnement
          </h3>
          <p className="desc" style={{ marginBottom: 14 }}>
            Verdeling op basis van de huidige status (ongefilterd).
          </p>
          <AdminSubscriptionSplitBar
            pctMet={metrics.pctMet}
            pctZonder={metrics.pctZonder}
            totalUsers={metrics.totalUsers}
            usersWithActiveSub={metrics.usersWithActiveSub}
          />
        </div>
      </div>

      <div className="card">
        <h3>Recent geregistreerde klanten</h3>
        <p className="desc">
          De vijf nieuwste accounts. Filter is hier niet van toepassing.
        </p>
        <AdminRecentCustomersTable customers={metrics.recentCustomers} />
      </div>
    </main>
  )
}
