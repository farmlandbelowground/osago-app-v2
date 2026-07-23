import { getServerClient } from '@shared/supabase/server'

import { AccountProfileRowSchema, type AccountProfileRow } from './schema'
import { type AccountProfile } from './types'

const rowToAccountProfile = (row: AccountProfileRow): AccountProfile => ({
  createdAt: row.created_at,
  email: row.email,
  firstName: row.first_name,
  id: row.id,
  lastName: row.last_name,
  partnerVoucherCode: row.partner_voucher_code,
  phone: row.phone,
  photo: row.photo,
  referredByPartnerId: row.referred_by_partner_id,
})

export const getAccountProfile = async (
  userId: string,
): Promise<AccountProfile | null> => {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, email, first_name, last_name, phone, photo, created_at, referred_by_partner_id, partner_voucher_code',
    )
    .eq('id', userId)
    .single()

  if (error || !data) {
    return null
  }

  const result = AccountProfileRowSchema.safeParse(data)

  return result.success ? rowToAccountProfile(result.data) : null
}
