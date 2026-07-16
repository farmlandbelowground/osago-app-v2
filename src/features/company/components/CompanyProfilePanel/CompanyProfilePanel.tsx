'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type FC } from 'react'
import { useForm } from 'react-hook-form'

import { useToastStore } from '@shared/store/toast'

import { fetchKvkBasisprofiel, saveCompanyProfile, unlinkKvkCompany } from '../../actions'
import { BuildingIcon, BuildingSimpleIcon, CheckIcon } from '../../assets/icons'
import { BEDRIJF_MARKT_ONTWIKKELING_DEFAULT } from '../../constants'
import { buildKvkPrefill } from '../../lib/buildKvkPrefill'
import { mergeKvkPrefill } from '../../lib/mergeKvkPrefill'
import {
  CompanyProfileFormSchema,
  type CompanyProfileInput,
  type KvkSearchResult,
} from '../../schema'
import { type Company, type KvkMergeableFields } from '../../types'
import { CompanyDetailsForm } from '../CompanyDetailsForm'
import { KvkSearchInput } from '../KvkSearchInput'
import { type KvkLinkState, type Props } from './types'

const buildDefaultValues = (company: Company | null): CompanyProfileInput => ({
  bedrijfMarktOntwikkeling:
    company?.bedrijfMarktOntwikkeling ?? BEDRIJF_MARKT_ONTWIKKELING_DEFAULT,
  city: company?.city ?? '',
  description: company?.description ?? '',
  employees: company?.employees ?? Number.NaN,
  founded: company?.founded ?? Number.NaN,
  houseNumber: company?.houseNumber ?? '',
  houseNumberExtra: company?.houseNumberExtra ?? '',
  legalForm: company?.legalForm ?? '',
  name: company?.name ?? '',
  postalCode: company?.postalCode ?? '',
  reasonForSale: company?.reasonForSale ?? '',
  sector: company?.sector ?? '',
  street: company?.street ?? '',
  usp: company?.usp ?? '',
  website: company?.website ?? '',
})

const buildInitialKvkLink = (company: Company | null): KvkLinkState => ({
  kvkNummer: company?.kvkNummer ?? null,
  kvkPrefilled: company?.kvkPrefilled ?? [],
  vestigingsnummer: company?.vestigingsnummer ?? null,
})

export const CompanyProfilePanel: FC<Props> = ({
  company,
  firstName,
  sectorOptions,
}) => {
  const [kvkLink, setKvkLink] = useState<KvkLinkState>(() =>
    buildInitialKvkLink(company),
  )
  const showToast = useToastStore(state => state.showToast)

  const form = useForm<CompanyProfileInput>({
    defaultValues: buildDefaultValues(company),
    resolver: zodResolver(CompanyProfileFormSchema),
  })

  const isLinked = kvkLink.kvkNummer !== null

  const onKvkSelect = async (result: KvkSearchResult): Promise<void> => {
    const basisprofielResult = await fetchKvkBasisprofiel(result.kvkNummer)
    const values = form.getValues()

    const existing: KvkMergeableFields = {
      city: values.city,
      employees: values.employees,
      founded: values.founded,
      houseNumber: values.houseNumber,
      houseNumberExtra: values.houseNumberExtra,
      kvkNummer: kvkLink.kvkNummer ?? undefined,
      name: values.name,
      postalCode: values.postalCode,
      sector: values.sector,
      street: values.street,
      vestigingsnummer: kvkLink.vestigingsnummer,
      website: values.website,
    }

    const { conflicts, prefill } = buildKvkPrefill(
      result,
      basisprofielResult.data,
      existing,
    )

    const overwrite =
      conflicts.length === 0 ||
      window.confirm(
        `Je hebt al gegevens ingevuld voor: ${conflicts.join(', ')}. Wil je deze overschrijven met KVK-gegevens?`,
      )

    const { kvkPrefilled, merged } = mergeKvkPrefill(existing, prefill, overwrite)
    const setValueOptions = { shouldDirty: true }

    if (merged.name !== undefined) {
      form.setValue('name', merged.name, setValueOptions)
    }
    if (merged.website !== undefined) {
      form.setValue('website', merged.website, setValueOptions)
    }
    if (merged.founded !== undefined) {
      form.setValue('founded', merged.founded, setValueOptions)
    }
    if (merged.employees !== undefined) {
      form.setValue('employees', merged.employees, setValueOptions)
    }
    if (merged.street !== undefined) {
      form.setValue('street', merged.street, setValueOptions)
    }
    if (merged.houseNumber !== undefined) {
      form.setValue('houseNumber', merged.houseNumber, setValueOptions)
    }
    if (merged.houseNumberExtra !== undefined) {
      form.setValue('houseNumberExtra', merged.houseNumberExtra, setValueOptions)
    }
    if (merged.postalCode !== undefined) {
      form.setValue('postalCode', merged.postalCode, setValueOptions)
    }
    if (merged.city !== undefined) {
      form.setValue('city', merged.city, setValueOptions)
    }

    setKvkLink({
      kvkNummer: merged.kvkNummer ?? null,
      kvkPrefilled,
      vestigingsnummer: merged.vestigingsnummer ?? null,
    })
  }

  const onUnlink = async (): Promise<void> => {
    if (
      !window.confirm(
        'Weet je zeker dat je de KVK-koppeling wilt loskoppelen? De ingevulde gegevens blijven behouden.',
      )
    ) {
      return
    }

    const result = await unlinkKvkCompany()

    if (!result.error) {
      setKvkLink({ kvkNummer: null, kvkPrefilled: [], vestigingsnummer: null })
    }
  }

  const onSubmit = async (data: CompanyProfileInput): Promise<void> => {
    const result = await saveCompanyProfile({
      ...data,
      kvkNummer: kvkLink.kvkNummer ?? '',
      kvkPrefilled: kvkLink.kvkPrefilled,
      vestigingsnummer: kvkLink.vestigingsnummer,
    })

    if (result.error) {
      form.setError('root', { message: result.error })
      return
    }

    showToast('Bedrijfsprofiel opgeslagen.')
  }

  return (
    <div className="flex flex-col">
      {!company?.sector && (
        <div className={`
          mb-6 rounded-md border border-[#BFDBFE] bg-[#EFF6FF] px-3.5 py-3
          text-[13px] text-[#1E40AF]
        `}>
          <strong className="font-semibold">
            Welkom{firstName && `, ${firstName}`}!
          </strong>{' '}
          Begin jouw verkooptraject door jouw bedrijfsprofiel in te vullen.
          Deze gegevens worden gebruikt om jouw waardebepaling,
          verkoopmemorandum en kopersmatching te genereren — je kunt later
          altijd terugkeren om aanpassingen te maken.
        </div>
      )}

      <div className={`
        relative mb-6 rounded-lg border border-border bg-gradient-to-br
        from-background to-surface px-6 py-5
      `}>
        <div className="mb-3.5 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <BuildingSimpleIcon className={`
              h-[22px] w-[22px] shrink-0 text-primary
            `} />
            <h3 className={`
              font-serif text-[18px] font-medium tracking-tight text-foreground
            `}>
              {isLinked
                ? 'Gekoppeld met het KVK Handelsregister'
                : 'Zoek jouw bedrijf in het KVK Handelsregister'}
            </h3>
          </div>
          {isLinked ? (
            <span className={`
              inline-flex items-center gap-1 rounded-full border border-primary
              bg-primary-soft px-2.5 py-[3px] text-[10.5px] font-semibold
              tracking-wide text-primary-hover uppercase
            `}>
              <CheckIcon className="h-3 w-3" />
              Gekoppeld
            </span>
          ) : (
            <span className={`
              inline-flex items-center gap-1.5 rounded-full border border-border
              bg-surface px-2.5 py-[3px] text-[10.5px] font-semibold
              tracking-wide text-muted-foreground uppercase
            `}>
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              KVK Handelsregister
            </span>
          )}
        </div>

        <KvkSearchInput onSelect={result => void onKvkSelect(result)} />

        {isLinked ? (
          <div className={`
            mt-2.5 flex flex-wrap items-center justify-between gap-3 rounded-md
            border border-primary bg-primary-soft px-4 py-3.5
          `}>
            <div className="flex items-center gap-3">
              <div className={`
                flex h-8 w-8 shrink-0 items-center justify-center rounded-full
                bg-primary text-primary-foreground
              `}>
                <CheckIcon className="h-4 w-4" />
              </div>
              <div>
                <div className={`
                  text-sm leading-tight font-semibold text-foreground
                `}>
                  {form.getValues('name')}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  KVK {kvkLink.kvkNummer}
                  {kvkLink.vestigingsnummer &&
                    ` · Vestiging ${kvkLink.vestigingsnummer}`}
                </div>
              </div>
            </div>
            <button
              className={`
                rounded-md px-3 py-1.5 text-[13px] font-semibold
                text-foreground-secondary
                hover:bg-border-soft
              `}
              onClick={() => void onUnlink()}
              type="button"
            >
              Loskoppelen
            </button>
          </div>
        ) : (
          <p className="mt-2.5 text-xs leading-normal text-muted-foreground">
            Selecteer jouw bedrijf om naam, KVK-nummer, locatie,
            oprichtingsjaar en sector automatisch in te vullen. Je kunt alle
            velden daarna nog aanpassen.
          </p>
        )}
      </div>

      {!isLinked ? (
        <div className={`
          rounded-lg border border-border bg-background px-6 py-12 text-center
        `}>
          <div className={`
            mx-auto mb-4 flex h-14 w-14 items-center justify-center
            rounded-[14px] border border-border bg-surface
          `}>
            <BuildingIcon className="h-[26px] w-[26px] text-muted-foreground" />
          </div>
          <h3 className="mb-1.5 font-serif text-xl font-medium text-foreground">
            Eerst jouw bedrijf koppelen
          </h3>
          <p className={`
            mx-auto max-w-md text-[13.5px] leading-relaxed text-muted-foreground
          `}>
            Zoek jouw bedrijf hierboven in het KVK Handelsregister om aan de
            slag te gaan. Zodra een bedrijf is gekoppeld, verschijnen de
            Algemene informatie en Jouw situatie hier.
          </p>
        </div>
      ) : (
        <CompanyDetailsForm
          form={form}
          kvkPrefilled={kvkLink.kvkPrefilled}
          logo={company?.logo ?? null}
          onSubmit={onSubmit}
          sectorOptions={sectorOptions}
        />
      )}
    </div>
  )
}
