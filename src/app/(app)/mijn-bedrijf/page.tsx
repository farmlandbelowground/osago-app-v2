import { CompanyProfilePanel } from '@features/company'
import { getCompany, getSectorOptions } from '@features/company/queries'
import { requireSession } from '@shared/auth/session'

export default async function MijnBedrijfPage() {
  const session = await requireSession()

  const [company, sectorOptions] = await Promise.all([
    getCompany(session.user.id),
    getSectorOptions(),
  ])

  return (
    <main className={`
      w-full px-10 pt-8 pb-20
      max-[900px]:p-5
    `}>
      <div className="mb-7">
        <h1 className={`
          font-serif text-[34px] leading-tight font-medium tracking-tight
          text-foreground
        `}>
          Bedrijfsprofiel
        </h1>
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
