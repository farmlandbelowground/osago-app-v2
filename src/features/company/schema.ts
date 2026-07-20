import { z } from 'zod'

import {
  BEDRIJF_MARKT_ONTWIKKELING_MAX,
  BEDRIJF_MARKT_ONTWIKKELING_MIN,
  FOUNDED_YEAR_MAX,
  FOUNDED_YEAR_MIN,
} from './constants'

// ─── /api/kvk/* response contracts (frozen backend — see migration-plan.md §1.1) ───

const KvkAdresSchema = z.object({
  binnenlandsAdres: z
    .object({
      huisnummer: z.union([z.string(), z.number()]).optional(),
      huisnummerToevoeging: z.string().optional(),
      plaats: z.string().optional(),
      postcode: z.string().optional(),
      straatnaam: z.string().optional(),
      type: z.string().optional(),
    })
    .optional(),
})

export const KvkZoekenResultaatSchema = z.object({
  adres: KvkAdresSchema.optional(),
  kvkNummer: z.string(),
  naam: z.string(),
  type: z.string().optional(),
  vestigingsnummer: z.string().optional(),
})

export type KvkSearchResult = z.infer<typeof KvkZoekenResultaatSchema>

export const KvkZoekenResponseSchema = z.object({
  pagina: z.number().optional(),
  resultatenPerPagina: z.number().optional(),
  resultaten: z.array(KvkZoekenResultaatSchema),
  totaal: z.number().optional(),
})

export const KvkBasisprofielResponseSchema = z
  .object({
    _embedded: z
      .object({
        hoofdvestiging: z
          .object({
            adressen: z
              .array(
                z.object({
                  huisletter: z.string().optional(),
                  huisnummer: z.union([z.string(), z.number()]).optional(),
                  huisnummerToevoeging: z.string().optional(),
                  plaats: z.string().optional(),
                  postcode: z.string().optional(),
                  straatnaam: z.string().optional(),
                  type: z.string().optional(),
                }),
              )
              .optional(),
            totaalWerkzamePersonen: z.number().optional(),
            websites: z.array(z.string()).optional(),
          })
          .optional(),
      })
      .optional(),
    formeleRegistratiedatum: z.string().optional(),
    handelsnamen: z.array(z.object({ naam: z.string() })).optional(),
    kvkNummer: z.string(),
  })
  .passthrough()

export type KvkBasisprofiel = z.infer<typeof KvkBasisprofielResponseSchema>

// ─── Supabase `companies` / `app_config` — direct read/write (not /api/*) ───

export const CompanyRowSchema = z.object({
  bedrijf_markt_ontwikkeling: z.number().nullable(),
  extra: z
    .object({
      city: z.string().optional(),
      description: z.string().optional(),
      employees: z.number().optional(),
      founded: z.number().optional(),
      houseNumber: z.string().optional(),
      houseNumberExtra: z.string().optional(),
      netProfit: z.number().nullable().optional(),
      postalCode: z.string().optional(),
      reasonForSale: z.string().optional(),
      recurringRevenue: z.number().nullable().optional(),
      street: z.string().optional(),
      usp: z.string().optional(),
      website: z.string().optional(),
    })
    .passthrough(),
  kvk_nummer: z.string().nullable(),
  kvk_prefilled: z.array(z.string()),
  legal_form: z.string().nullable(),
  logo: z.string().nullable(),
  name: z.string().nullable(),
  sector: z.string().nullable(),
  user_id: z.string(),
  vestigingsnummer: z.string().nullable(),
})

export type CompanyRow = z.infer<typeof CompanyRowSchema>

export const AppConfigValuationMultiplesSchema = z.array(
  z.object({
    id: z.string(),
    label: z.string(),
    sectoropslag: z.number().optional(),
    value: z.number(),
  }),
)

// ─── Client-side form validation (mirrors legacy's HTML5 required/min/max) ───

export const CompanyProfileFormSchema = z.object({
  bedrijfMarktOntwikkeling: z
    .number()
    .int()
    .min(BEDRIJF_MARKT_ONTWIKKELING_MIN)
    .max(BEDRIJF_MARKT_ONTWIKKELING_MAX),
  city: z.string().min(1, 'Vul een plaats in.'),
  description: z.string().min(1, 'Vul een bedrijfsomschrijving in.'),
  employees: z.number().int().min(0, 'Vul het aantal medewerkers in.'),
  founded: z
    .number()
    .int()
    .min(FOUNDED_YEAR_MIN, `Vul een jaar vanaf ${FOUNDED_YEAR_MIN} in.`)
    .max(FOUNDED_YEAR_MAX, `Vul een jaar tot en met ${FOUNDED_YEAR_MAX} in.`),
  houseNumber: z.string().min(1, 'Vul een huisnummer in.'),
  houseNumberExtra: z.string().optional(),
  legalForm: z.string().min(1, 'Selecteer een ondernemingsvorm.'),
  name: z.string().min(1, 'Vul een bedrijfsnaam in.'),
  postalCode: z.string().min(1, 'Vul een postcode in.'),
  reasonForSale: z.string().min(1, 'Vul een reden voor verkoop in.'),
  sector: z.string().min(1, 'Selecteer een sector.'),
  street: z.string().min(1, 'Vul een straatnaam in.'),
  usp: z.string().min(1, 'Vul jouw unique selling point in.'),
  website: z.string().min(1, 'Vul een website in.'),
})

export type CompanyProfileInput = z.infer<typeof CompanyProfileFormSchema>

export const SaveCompanyProfileSchema = CompanyProfileFormSchema.extend({
  kvkNummer: z.string().min(1, 'Koppel eerst een bedrijf via KVK.'),
  kvkPrefilled: z.array(z.string()),
  vestigingsnummer: z.string().nullable(),
})

export type SaveCompanyProfileInput = z.infer<typeof SaveCompanyProfileSchema>
