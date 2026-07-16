import { FOUNDED_YEAR_MAX, FOUNDED_YEAR_MIN, KVK_CONFLICT_CHECK_KEYS } from '../constants'
import { type KvkBasisprofiel, type KvkSearchResult } from '../schema'
import {
  type BuildKvkPrefillResult,
  type KvkMergeableFields,
} from '../types'

const FOUNDED_DATE_YEAR_LENGTH = 4

const isEmpty = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  value === '' ||
  (typeof value === 'number' && Number.isNaN(value))

const hasConflict = (
  prefillValue: unknown,
  existingValue: unknown,
): boolean =>
  !isEmpty(prefillValue) &&
  !isEmpty(existingValue) &&
  String(existingValue) !== String(prefillValue)

const parseFoundedYear = (
  formeleRegistratiedatum: string | undefined,
): number | undefined => {
  if (!formeleRegistratiedatum) {
    return undefined
  }

  const year = Number.parseInt(
    formeleRegistratiedatum.slice(0, FOUNDED_DATE_YEAR_LENGTH),
    10,
  )

  return year >= FOUNDED_YEAR_MIN && year <= FOUNDED_YEAR_MAX
    ? year
    : undefined
}

// Typed equivalent of legacy's selectKvkResult prefill-building + conflict
// detection (osago-bundle.js:8330-8393). Sector is deliberately never
// populated — the user always picks it from the app_config-sourced list.
export const buildKvkPrefill = (
  searchResult: KvkSearchResult,
  basisprofiel: KvkBasisprofiel | null,
  existing: KvkMergeableFields,
): BuildKvkPrefillResult => {
  const adres = searchResult.adres?.binnenlandsAdres

  const prefill: KvkMergeableFields = {
    city: adres?.plaats ?? existing.city,
    houseNumber:
      adres?.huisnummer !== undefined
        ? String(adres.huisnummer)
        : existing.houseNumber,
    houseNumberExtra: adres?.huisnummerToevoeging ?? existing.houseNumberExtra,
    kvkNummer: searchResult.kvkNummer,
    name: searchResult.naam,
    postalCode: adres?.postcode ?? existing.postalCode,
    street: adres?.straatnaam ?? existing.street,
    vestigingsnummer: searchResult.vestigingsnummer ?? null,
  }

  if (basisprofiel) {
    const founded = parseFoundedYear(basisprofiel.formeleRegistratiedatum)

    if (founded !== undefined) {
      prefill.founded = founded
    }

    const handelsnaam = basisprofiel.handelsnamen?.[0]?.naam

    if (handelsnaam) {
      prefill.name = handelsnaam
    }

    const hoofdvestiging = basisprofiel._embedded?.hoofdvestiging

    if (hoofdvestiging) {
      const website = hoofdvestiging.websites?.[0]

      if (website) {
        prefill.website = website
      }

      if (hoofdvestiging.totaalWerkzamePersonen !== undefined) {
        prefill.employees = hoofdvestiging.totaalWerkzamePersonen
      }

      const adressen = hoofdvestiging.adressen ?? []
      const bezoekadres =
        adressen.find(entry => entry.type === 'bezoekadres') ?? adressen[0]

      if (bezoekadres) {
        if (bezoekadres.straatnaam) {
          prefill.street = bezoekadres.straatnaam
        }

        if (bezoekadres.huisnummer !== undefined) {
          prefill.houseNumber = String(bezoekadres.huisnummer)
        }

        const houseNumberExtra = [
          bezoekadres.huisletter,
          bezoekadres.huisnummerToevoeging,
        ]
          .filter(Boolean)
          .join('')

        if (houseNumberExtra) {
          prefill.houseNumberExtra = houseNumberExtra
        }

        if (bezoekadres.postcode) {
          prefill.postalCode = bezoekadres.postcode
        }

        if (bezoekadres.plaats) {
          prefill.city = bezoekadres.plaats
        }
      }
    }
  }

  const conflicts = KVK_CONFLICT_CHECK_KEYS.filter(key =>
    hasConflict(prefill[key], existing[key]),
  )

  return { conflicts, prefill }
}
