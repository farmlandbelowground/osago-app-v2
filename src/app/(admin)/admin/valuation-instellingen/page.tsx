import { type Metadata } from 'next'

import { AdminValuationSettings } from '@features/valuation'
import {
  getDcfAdminDefaults,
  getSmallEbitdaDeductions,
  getSmallOrgDeductions,
  getValuationMultiples,
} from '@features/valuation/queries'
import { requireRole } from '@shared/auth/guards'

export const metadata: Metadata = {
  title: 'Valuation',
}

export default async function AdminValuationInstellingenPage() {
  await requireRole('admin')

  const [dcfDefaults, multiples, ebitdaDeductions, orgDeductions] =
    await Promise.all([
      getDcfAdminDefaults(),
      getValuationMultiples(),
      getSmallEbitdaDeductions(),
      getSmallOrgDeductions(),
    ])

  return (
    <main className="main">
      <AdminValuationSettings
        dcfDefaults={dcfDefaults}
        ebitdaDeductions={ebitdaDeductions}
        multiples={multiples}
        orgDeductions={orgDeductions}
      />
    </main>
  )
}
