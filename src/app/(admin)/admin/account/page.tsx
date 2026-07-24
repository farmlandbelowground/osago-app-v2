import { type Metadata } from 'next'

import {
  AccountPasswordForm,
  AccountPersonalInfoForm,
  AccountPhotoUpload,
  AdminAccountInfoCard,
  AdminAvailabilityCard,
} from '@features/auth'
import { getAccountProfile } from '@features/auth/queries'
import { requireSession } from '@shared/auth/session'

export const metadata: Metadata = {
  title: 'Mijn account',
}

export default async function AdminAccountPage() {
  const session = await requireSession()

  const profile = await getAccountProfile(session.user.id)

  if (!profile) {
    throw new Error('Accountprofiel niet gevonden.')
  }

  return (
    <main className="main">
      <div className="page-header">
        <h1 className="page-title">Mijn account</h1>
      </div>

      <AccountPhotoUpload
        createdAt={profile.createdAt}
        email={profile.email}
        firstName={profile.firstName}
        lastName={profile.lastName}
        photo={profile.photo}
        role={session.role}
      />
      <AccountPersonalInfoForm profile={profile} />
      <AccountPasswordForm email={profile.email} />
      <AdminAvailabilityCard adminId={session.user.id} />
      <AdminAccountInfoCard createdAt={profile.createdAt} id={profile.id} />
    </main>
  )
}
