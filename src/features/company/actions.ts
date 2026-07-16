'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { type ApiResult } from '@shared/api/fetcher'
import { legacyApiFetch } from '@shared/api/legacyApiFetch'
import { requireSession } from '@shared/auth/session'
import { getServerClient } from '@shared/supabase/server'

import {
  KVK_BASISPROFIEL_ENDPOINT,
  KVK_ZOEKEN_ENDPOINT,
  MIJN_BEDRIJF_PATH,
} from './constants'
import {
  KvkBasisprofielResponseSchema,
  KvkZoekenResponseSchema,
  SaveCompanyProfileSchema,
  type KvkBasisprofiel,
  type KvkSearchResult,
  type SaveCompanyProfileInput,
} from './schema'

type ActionResult = { error: null } | { error: string }
type SaveCompanyProfileResult =
  | { data: null; error: string }
  | { data: SaveCompanyProfileInput; error: null }

export const searchKvkCompanies = async (
  query: string,
): Promise<ApiResult<KvkSearchResult[]>> => {
  try {
    const result = await legacyApiFetch(
      `${KVK_ZOEKEN_ENDPOINT}?q=${encodeURIComponent(query)}`,
      { schema: KvkZoekenResponseSchema },
    )

    if (result.error !== null) {
      return { data: null, error: result.error }
    }

    return { data: result.data.resultaten, error: null }
  } catch {
    return { data: null, error: 'KVK-zoekopdracht mislukt.' }
  }
}

// Best-effort enrichment — failures fall back to search-result-only data,
// matching legacy's selectKvkResult try/catch (osago-bundle.js:8322-8325).
export const fetchKvkBasisprofiel = async (
  kvkNummer: string,
): Promise<ApiResult<KvkBasisprofiel>> => {
  try {
    return await legacyApiFetch(
      `${KVK_BASISPROFIEL_ENDPOINT}?kvkNummer=${encodeURIComponent(kvkNummer)}`,
      { schema: KvkBasisprofielResponseSchema },
    )
  } catch {
    return { data: null, error: 'KVK-basisprofiel ophalen mislukt.' }
  }
}

export const saveCompanyProfile = async (
  input: SaveCompanyProfileInput,
): Promise<SaveCompanyProfileResult> => {
  const parsed = SaveCompanyProfileSchema.safeParse(input)

  if (!parsed.success) {
    return { data: null, error: 'Controleer de ingevulde gegevens.' }
  }

  const session = await requireSession()
  const supabase = await getServerClient()

  const { data: existingRow } = await supabase
    .from('companies')
    .select('extra')
    .eq('user_id', session.user.id)
    .maybeSingle()

  const currentExtra: Record<string, unknown> =
    existingRow && typeof existingRow.extra === 'object' && existingRow.extra
      ? existingRow.extra
      : {}

  const {
    bedrijfMarktOntwikkeling,
    city,
    description,
    employees,
    founded,
    houseNumber,
    houseNumberExtra,
    kvkNummer,
    kvkPrefilled,
    legalForm,
    name,
    postalCode,
    reasonForSale,
    sector,
    street,
    usp,
    vestigingsnummer,
    website,
  } = parsed.data

  const { error } = await supabase.from('companies').upsert(
    {
      bedrijf_markt_ontwikkeling: bedrijfMarktOntwikkeling,
      extra: {
        ...currentExtra,
        city,
        description,
        employees,
        founded,
        houseNumber,
        houseNumberExtra,
        postalCode,
        reasonForSale,
        street,
        usp,
        website,
      },
      kvk_nummer: kvkNummer,
      kvk_prefilled: kvkPrefilled,
      legal_form: legalForm,
      name,
      sector,
      user_id: session.user.id,
      vestigingsnummer,
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    return { data: null, error: 'Opslaan is mislukt. Probeer het opnieuw.' }
  }

  revalidatePath(MIJN_BEDRIJF_PATH)
  return { data: parsed.data, error: null }
}

// Matches legacy's clearKvkLink exactly (osago-bundle.js:8422-8432) — clears
// only the KVK link, deliberately keeping every other field value in place.
export const unlinkKvkCompany = async (): Promise<ActionResult> => {
  const session = await requireSession()
  const supabase = await getServerClient()

  const { error } = await supabase
    .from('companies')
    .update({ kvk_nummer: null, kvk_prefilled: [], vestigingsnummer: null })
    .eq('user_id', session.user.id)

  if (error) {
    return { error: 'Loskoppelen is mislukt. Probeer het opnieuw.' }
  }

  revalidatePath(MIJN_BEDRIJF_PATH)
  return { error: null }
}

const LogoDataUrlSchema = z.string().min(1)

export const updateCompanyLogo = async (
  dataUrl: string,
): Promise<ActionResult> => {
  const parsed = LogoDataUrlSchema.safeParse(dataUrl)

  if (!parsed.success) {
    return { error: 'Ongeldig logobestand.' }
  }

  const session = await requireSession()
  const supabase = await getServerClient()

  const { error } = await supabase
    .from('companies')
    .upsert(
      { logo: parsed.data, user_id: session.user.id },
      { onConflict: 'user_id' },
    )

  if (error) {
    return { error: 'Logo opslaan is mislukt. Probeer het opnieuw.' }
  }

  revalidatePath(MIJN_BEDRIJF_PATH)
  return { error: null }
}

export const removeCompanyLogo = async (): Promise<ActionResult> => {
  const session = await requireSession()
  const supabase = await getServerClient()

  const { error } = await supabase
    .from('companies')
    .update({ logo: null })
    .eq('user_id', session.user.id)

  if (error) {
    return { error: 'Logo verwijderen is mislukt. Probeer het opnieuw.' }
  }

  revalidatePath(MIJN_BEDRIJF_PATH)
  return { error: null }
}
