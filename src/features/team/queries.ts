import { getServerClient } from '@shared/supabase/server'

import { StaffProfileRowSchema } from './schema'
import { type StaffMember } from './types'

// Real read under is_admin() RLS — profiles with an admin role. Mirrors legacy
// db.admins, which is hydrated from these same rows (profileToAdmin).
export const adminListStaff = async (): Promise<StaffMember[]> => {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, phone, photo, role, created_at')
    .in('role', ['admin', 'admin_user'])
    .order('created_at', { ascending: true })

  if (error || !data) {
    return []
  }

  return data
    .map(row => StaffProfileRowSchema.safeParse(row))
    .filter(result => result.success)
    .map(result => {
      const row = result.data

      return {
        active: true,
        createdAt: row.created_at ? Date.parse(row.created_at) : null,
        email: row.email,
        firstName: row.first_name ?? '',
        id: row.id,
        lastName: row.last_name ?? '',
        phone: row.phone ?? '',
        photo: row.photo,
        role: row.role === 'admin' ? 'admin' : 'user',
      }
    })
}
