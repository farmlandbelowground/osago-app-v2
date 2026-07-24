import { type Metadata } from 'next'

import { CompanyProfilePanel } from '@features/company'
import { getCompany, getSectorOptions } from '@features/company/queries'
import { requireSession } from '@shared/auth/session'

export const metadata: Metadata = {
  title: 'Mijn bedrijf',
}

export default async function MijnBedrijfPage() {
  const session = await requireSession()

  const [company, sectorOptions] = await Promise.all([
    getCompany(session.user.id),
    getSectorOptions(),
  ])

  return (
    <main className="main">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bedrijfsprofiel</h1>
        </div>
      </div>
      <CompanyProfilePanel
        company={company}
        firstName={session.firstName}
        key={company?.kvkNummer ?? 'unlinked'}
        sectorOptions={sectorOptions}
      />
    </main>
  )
}
