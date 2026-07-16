import { getServerClient } from '@shared/supabase/server'

import { APP_CONFIG_VALUATION_MULTIPLES_KEY } from './constants'
import {
  AppConfigValuationMultiplesSchema,
  CompanyRowSchema,
  type CompanyRow,
} from './schema'
import { type Company, type SectorOption } from './types'

const rowToCompany = (row: CompanyRow): Company => ({
  bedrijfMarktOntwikkeling: row.bedrijf_markt_ontwikkeling,
  city: row.extra.city ?? '',
  description: row.extra.description ?? '',
  employees: row.extra.employees ?? null,
  founded: row.extra.founded ?? null,
  houseNumber: row.extra.houseNumber ?? '',
  houseNumberExtra: row.extra.houseNumberExtra ?? '',
  kvkNummer: row.kvk_nummer,
  kvkPrefilled: row.kvk_prefilled,
  legalForm: row.legal_form ?? '',
  logo: row.logo,
  name: row.name ?? '',
  postalCode: row.extra.postalCode ?? '',
  reasonForSale: row.extra.reasonForSale ?? '',
  sector: row.sector ?? '',
  street: row.extra.street ?? '',
  usp: row.extra.usp ?? '',
  userId: row.user_id,
  vestigingsnummer: row.vestigingsnummer,
  website: row.extra.website ?? '',
})

export const getCompany = async (userId: string): Promise<Company | null> => {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  const result = CompanyRowSchema.safeParse(data)

  return result.success ? rowToCompany(result.data) : null
}

export const getSectorOptions = async (): Promise<SectorOption[]> => {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', APP_CONFIG_VALUATION_MULTIPLES_KEY)
    .maybeSingle()

  if (error || !data) {
    return []
  }

  const result = AppConfigValuationMultiplesSchema.safeParse(data.value)

  return result.success ? result.data : []
}
