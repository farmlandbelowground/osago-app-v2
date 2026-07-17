import {
  AccountPasswordForm,
  AccountPersonalInfoForm,
  AccountPhotoUpload,
  AdminAccountInfoCard,
  AdminAvailabilityCard,
} from '@features/auth'
import { getAccountProfile } from '@features/auth/queries'
import { requireSession } from '@shared/auth/session'

export default async function AdminAccountPage() {
  const session = await requireSession()

  const profile = await getAccountProfile(session.user.id)

  if (!profile) {
    throw new Error('Accountprofiel niet gevonden.')
  }

  return (
    <main
      className={`
        w-full px-10 pt-8 pb-20
        max-[900px]:p-5
      `}
    >
      <div className="mb-7">
        <h1
          className={`
            font-serif text-[34px] leading-tight font-medium tracking-tight
            text-foreground
          `}
        >
          Mijn account
        </h1>
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
