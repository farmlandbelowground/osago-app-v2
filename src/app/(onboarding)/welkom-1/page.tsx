import { CompanyProfilePanel } from '@features/company'
import { getCompany, getSectorOptions } from '@features/company/queries'
import { OnboardingShell } from '@features/onboarding'
import { WELKOM_PATHS } from '@features/onboarding/constants'
import { requireSession } from '@shared/auth/session'

export default async function Welkom1Page() {
  const session = await requireSession()

  const [company, sectorOptions] = await Promise.all([
    getCompany(session.user.id),
    getSectorOptions(),
  ])

  return (
    <OnboardingShell
      completeHint="Koppel jouw bedrijf via KVK om verder te gaan."
      isStepComplete={!!company?.kvkNummer}
      stepIndex={1}
    >
      <div className="page-header">
        <div>
          <h1 className="page-title">Bedrijfsprofiel</h1>
        </div>
      </div>
      <CompanyProfilePanel
        company={company}
        firstName={session.firstName}
        key={company?.kvkNummer ?? 'unlinked'}
        onboardingNextPath={WELKOM_PATHS[2]}
        sectorOptions={sectorOptions}
      />
    </OnboardingShell>
  )
}
