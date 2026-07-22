import { ScorecardWorkspace } from '@features/scorecard'
import { getScorecardCompany } from '@features/scorecard/queries'
import { requireImpersonation } from '@shared/auth/guards'

export default async function VerkoopklaarMakenPage() {
  await requireImpersonation()

  const { company, reportInVault, state } = await getScorecardCompany()

  return (
    <main className="main">
      <ScorecardWorkspace
        company={company}
        initialState={state}
        reportInVault={reportInVault}
      />
    </main>
  )
}
