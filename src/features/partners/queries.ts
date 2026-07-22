import { getServerClient } from '@shared/supabase/server'

import { PARTNERS_TABLE } from './constants'
import { PartnerRowSchema, rowToPartner } from './schema'
import { type Partner } from './types'

// Anon-safe: RLS partners_select restricts anon reads to active rows, so the
// public /partner/<slug> page works logged-out. Mirrors legacy
// OsagoData.fetchPartnerBySlug (osago-data.js:905).
export const getActivePartnerBySlug = async (
  slug: string,
): Promise<Partner | null> => {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from(PARTNERS_TABLE)
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  const parsed = PartnerRowSchema.safeParse(data)

  return parsed.success ? rowToPartner(parsed.data) : null
}

// Admin RLS returns inactive partners too. Sorted createdAt desc, matching
// legacy renderAdminPartners (osago-bundle.js:26316).
export const adminListPartners = async (): Promise<Partner[]> => {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from(PARTNERS_TABLE)
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !data) {
    return []
  }

  return data.flatMap(row => {
    const parsed = PartnerRowSchema.safeParse(row)

    return parsed.success ? [rowToPartner(parsed.data)] : []
  })
}
