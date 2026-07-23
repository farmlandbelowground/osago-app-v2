'use server'

import { revalidatePath } from 'next/cache'

import { legacyApiFetch } from '@shared/api/legacyApiFetch'
import { requireRole } from '@shared/auth/guards'
import { getServerClient } from '@shared/supabase/server'
import {
  AvailabilitySchema,
  type Availability,
} from '@shared/types/availability'

import {
  ADMIN_MEDEWERKER_PATH,
  CREATE_STAFF_ENDPOINT,
  UPDATE_USER_ENDPOINT,
} from './constants'
import {
  CreateStaffResponseSchema,
  StaffInputSchema,
  UpdateUserResponseSchema,
} from './schema'
import { type StaffMemberFormData } from './types'

type ActionResult = { error: null } | { error: string }

type SupabaseServerClient = Awaited<ReturnType<typeof getServerClient>>

// The "hoofd-admin" is the earliest-created full admin. There is no v2 sentinel
// for legacy's 'a1'; the earliest admin acts as it and is protected from role
// change, deactivation and deletion. Recomputed server-side so the client guard
// stays advisory only.
const getHoofdAdminId = async (
  supabase: SupabaseServerClient,
): Promise<string | null> => {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  return data?.id ?? null
}

// Provisions a real Supabase Auth user + profiles row (role admin/admin_user)
// via the frozen create-staff endpoint. The endpoint does not set the photo, so
// it is written separately afterwards (profiles.photo, under is_admin() RLS).
export const createStaff = async (
  input: StaffMemberFormData,
): Promise<ActionResult> => {
  const parsed = StaffInputSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Controleer de gegevens.',
    }
  }

  await requireRole('admin')

  const result = await legacyApiFetch(CREATE_STAFF_ENDPOINT, {
    body: JSON.stringify({
      email: parsed.data.email.toLowerCase(),
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      password: parsed.data.password,
      phone: parsed.data.phone,
      role: parsed.data.role,
    }),
    method: 'POST',
    schema: CreateStaffResponseSchema,
  })

  if (result.error !== null || !result.data.ok || !result.data.userId) {
    return { error: result.data?.error ?? 'Aanmaken medewerker mislukt.' }
  }

  if (parsed.data.photo) {
    const supabase = await getServerClient()
    await supabase
      .from('profiles')
      .update({ photo: parsed.data.photo })
      .eq('id', result.data.userId)
  }

  revalidatePath(ADMIN_MEDEWERKER_PATH)
  return { error: null }
}

// Updates a member's profile fields; role + active only when the caller is
// neither the member itself nor the hoofd-admin. Credentials (email/password)
// live in Supabase Auth, so they go through the frozen update-user endpoint —
// only the changed fields are sent.
export const updateStaff = async (
  id: string,
  data: StaffMemberFormData,
): Promise<ActionResult> => {
  const parsed = StaffInputSchema.safeParse(data)

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Controleer de gegevens.',
    }
  }

  const session = await requireRole('admin')
  const supabase = await getServerClient()
  const hoofdAdminId = await getHoofdAdminId(supabase)
  const isProtected = id === session.user.id || id === hoofdAdminId

  const updates: {
    active?: boolean
    first_name: string
    last_name: string
    phone: string
    photo: string | null
    role?: 'admin' | 'admin_user'
  } = {
    first_name: parsed.data.firstName,
    last_name: parsed.data.lastName,
    phone: parsed.data.phone,
    photo: parsed.data.photo,
  }

  if (!isProtected) {
    updates.role = parsed.data.role === 'admin' ? 'admin' : 'admin_user'
    updates.active = parsed.data.active
  }

  const { error } = await supabase.from('profiles').update(updates).eq('id', id)

  if (error) {
    return { error: 'Bijwerken van de medewerker is mislukt.' }
  }

  const changedCreds: { email?: string; password?: string } = {}

  if (parsed.data.password) {
    changedCreds.password = parsed.data.password
  }

  const newEmail = parsed.data.email.toLowerCase()
  const { data: current } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', id)
    .maybeSingle()

  if (current?.email && current.email.toLowerCase() !== newEmail) {
    changedCreds.email = newEmail
  }

  if (changedCreds.email || changedCreds.password) {
    const credResult = await legacyApiFetch(UPDATE_USER_ENDPOINT, {
      body: JSON.stringify({ targetUserId: id, ...changedCreds }),
      method: 'POST',
      schema: UpdateUserResponseSchema,
    })

    if (credResult.error !== null || !credResult.data.ok) {
      return {
        error:
          credResult.data?.error ?? 'Bijwerken van inloggegevens is mislukt.',
      }
    }
  }

  revalidatePath(ADMIN_MEDEWERKER_PATH)
  return { error: null }
}

export const removeStaff = async (id: string): Promise<ActionResult> => {
  const session = await requireRole('admin')
  const supabase = await getServerClient()
  const hoofdAdminId = await getHoofdAdminId(supabase)

  if (id === session.user.id || id === hoofdAdminId) {
    return { error: 'Deze medewerker kan niet verwijderd worden.' }
  }

  const { error } = await supabase.from('profiles').delete().eq('id', id)

  if (error) {
    return { error: 'Verwijderen van de medewerker is mislukt.' }
  }

  revalidatePath(ADMIN_MEDEWERKER_PATH)
  return { error: null }
}

export const setStaffActive = async (
  id: string,
  active: boolean,
): Promise<ActionResult> => {
  const session = await requireRole('admin')
  const supabase = await getServerClient()
  const hoofdAdminId = await getHoofdAdminId(supabase)

  if (id === session.user.id || id === hoofdAdminId) {
    return { error: 'Deze medewerker kan niet gedeactiveerd worden.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ active })
    .eq('id', id)

  if (error) {
    return { error: 'Wijzigen van de status is mislukt.' }
  }

  revalidatePath(ADMIN_MEDEWERKER_PATH)
  return { error: null }
}

export const setStaffAvailability = async (
  id: string,
  availability: Availability,
): Promise<ActionResult> => {
  const parsed = AvailabilitySchema.safeParse(availability)

  if (!parsed.success) {
    return { error: 'Ongeldig rooster.' }
  }

  await requireRole('admin')
  const supabase = await getServerClient()

  const { error } = await supabase
    .from('profiles')
    .update({ availability: parsed.data })
    .eq('id', id)

  if (error) {
    return { error: 'Opslaan van het rooster is mislukt.' }
  }

  revalidatePath(ADMIN_MEDEWERKER_PATH)
  return { error: null }
}
