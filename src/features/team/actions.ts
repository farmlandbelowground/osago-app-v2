'use server'

import { revalidatePath } from 'next/cache'

import { requireRole } from '@shared/auth/guards'
import { getServerClient } from '@shared/supabase/server'

import { ADMIN_MEDEWERKER_PATH } from './constants'
import { ChangeStaffRoleSchema } from './schema'
import { type StaffRole } from './types'

type ActionResult = { error: null } | { error: string }

// The ONE persisting staff mutation (D-B): a role change on an existing member.
// RLS allows is_full_admin to update profiles.role, guarded by the
// prevent_role_change trigger; requireRole('admin') is the app-level mirror.
//
// Create / deactivate / rooster are deliberately NOT server actions — legacy
// kept them in localStorage (db.admins) and never synced them, and there is no
// admin-create-Auth-user endpoint in the frozen backend. v2 reproduces that as
// client-only session state (see TeamGrid) so the new/edited member appears in
// the session view without persisting. This is expected per D-B and needs a
// future admin-provisioning endpoint + a profiles.active column + rooster
// persistence to become real.
export const changeStaffRole = async (
  staffId: string,
  role: StaffRole,
): Promise<ActionResult> => {
  const parsed = ChangeStaffRoleSchema.safeParse({ role, staffId })

  if (!parsed.success) {
    return { error: 'Ongeldige invoer.' }
  }

  const session = await requireRole('admin')

  if (parsed.data.staffId === session.user.id) {
    return { error: 'Je kunt jouw eigen rol niet wijzigen.' }
  }

  const supabase = await getServerClient()
  const dbRole = parsed.data.role === 'admin' ? 'admin' : 'admin_user'

  const { error } = await supabase
    .from('profiles')
    .update({ role: dbRole })
    .eq('id', parsed.data.staffId)

  if (error) {
    return { error: 'Rol wijzigen is mislukt. Probeer het opnieuw.' }
  }

  revalidatePath(ADMIN_MEDEWERKER_PATH)
  return { error: null }
}
