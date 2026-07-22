'use server'

import { revalidatePath } from 'next/cache'

import { requireRole } from '@shared/auth/guards'
import { getServerClient } from '@shared/supabase/server'

import {
  ADMIN_PARTNERS_PATH,
  PARTNERS_TABLE,
  PARTNER_ID_PREFIX,
} from './constants'
import { ensureUniquePartnerSlug, slugifyPartnerName } from './lib/slug'
import { AdminPartnerFormSchema, type PartnerFormInput } from './schema'

type ActionResult = { error: null } | { error: string }

export const adminSavePartner = async (
  input: PartnerFormInput,
): Promise<ActionResult> => {
  const parsed = AdminPartnerFormSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ?? 'Controleer de ingevulde gegevens.',
    }
  }

  const session = await requireRole('admin')
  const {
    active,
    contactEmail,
    contactPerson,
    contactPhone,
    description,
    id,
    logo,
    name,
    slug,
    voucherId,
  } = parsed.data

  const slugBase = slugifyPartnerName(slug || name)
  if (!slugBase) {
    return {
      error: 'Slug kon niet worden bepaald — vul een geldige naam of slug in.',
    }
  }
  if (!/^[a-z0-9-]+$/.test(slugBase)) {
    return {
      error: 'Slug mag alleen kleine letters, cijfers en streepjes bevatten.',
    }
  }

  const supabase = await getServerClient()
  const { data: partnerRows } = await supabase
    .from(PARTNERS_TABLE)
    .select('id, slug')
  const existing = (partnerRows ?? []).map(row => ({
    id: String(row.id),
    slug: String(row.slug),
  }))
  const uniqueSlug = ensureUniquePartnerSlug(slugBase, id ?? null, existing)

  const payload = {
    active,
    contact_email: contactEmail?.trim() || null,
    contact_person: contactPerson?.trim() || null,
    contact_phone: contactPhone?.trim() || null,
    description: description?.trim() || null,
    id: id ?? `${PARTNER_ID_PREFIX}${crypto.randomUUID()}`,
    logo: logo || null,
    name: name.trim(),
    slug: uniqueSlug,
    voucher_id: voucherId || null,
    ...(id ? {} : { created_by: session.user.id }),
  }

  const { error } = await supabase.from(PARTNERS_TABLE).upsert(payload)
  if (error) {
    return { error: 'Opslaan is mislukt. Probeer het opnieuw.' }
  }

  revalidatePath(ADMIN_PARTNERS_PATH)
  return { error: null }
}

export const adminDeletePartner = async (id: string): Promise<ActionResult> => {
  if (!id) {
    return { error: 'Ongeldige partner.' }
  }

  await requireRole('admin')
  const supabase = await getServerClient()
  const { error } = await supabase.from(PARTNERS_TABLE).delete().eq('id', id)

  if (error) {
    return { error: 'Verwijderen is mislukt. Probeer het opnieuw.' }
  }

  revalidatePath(ADMIN_PARTNERS_PATH)
  return { error: null }
}
