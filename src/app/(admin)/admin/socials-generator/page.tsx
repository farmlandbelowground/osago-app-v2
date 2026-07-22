import { SocialsGenerator } from '@features/socials'
import { requireRole } from '@shared/auth/guards'

export default async function AdminSocialsGeneratorPage() {
  await requireRole('admin')

  return (
    <main className="main">
      <div className="page-header">
        <div>
          <h1 className="page-title">Socials generator</h1>
          <p className="desc">
            Eén onderwerp → drie posts (Instagram + LinkedIn + Facebook) en een
            ZIP-export.
          </p>
        </div>
      </div>
      <SocialsGenerator />
    </main>
  )
}
