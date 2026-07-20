'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
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
  onboardingNextPath,
  sectorOptions,
}) => {
  const router = useRouter()
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

    if (onboardingNextPath) {
      router.push(onboardingNextPath)
      return
    }

    showToast('Bedrijfsprofiel opgeslagen.')
  }

  return (
    <div>
      {!company?.sector && (
        <div className="alert alert-info">
          <strong>Welkom{firstName && `, ${firstName}`}!</strong> Begin jouw
          verkooptraject door jouw bedrijfsprofiel in te vullen. Deze gegevens
          worden gebruikt om jouw waardebepaling, verkoopmemorandum en
          kopersmatching te genereren — je kunt later altijd terugkeren om
          aanpassingen te maken.
        </div>
      )}

      <div className="kvk-card">
        <div className="kvk-head">
          <div className="kvk-title">
            <BuildingSimpleIcon height={22} width={22} />
            <h3>
              {isLinked
                ? 'Gekoppeld met het KVK Handelsregister'
                : 'Zoek jouw bedrijf in het KVK Handelsregister'}
            </h3>
          </div>
          {isLinked ? (
            <span
              className="kvk-badge"
              style={{
                background: 'var(--green-soft)',
                color: 'var(--green-dark)',
                borderColor: 'var(--green)',
              }}
            >
              <CheckIcon height={12} width={12} />
              Gekoppeld
            </span>
          ) : (
            <span className="kvk-badge">KVK Handelsregister</span>
          )}
        </div>

        <KvkSearchInput onSelect={result => void onKvkSelect(result)} />

        {isLinked ? (
          <div className="kvk-selected">
            <div className="kvk-selected-info">
              <div className="kvk-selected-check">
                <CheckIcon height={16} width={16} />
              </div>
              <div>
                <div className="kvk-selected-name">
                  {form.getValues('name')}
                </div>
                <div className="kvk-selected-meta">
                  KVK {kvkLink.kvkNummer}
                  {kvkLink.vestigingsnummer &&
                    ` · Vestiging ${kvkLink.vestigingsnummer}`}
                </div>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => void onUnlink()}
              type="button"
            >
              Loskoppelen
            </button>
          </div>
        ) : (
          <div className="kvk-help">
            Selecteer jouw bedrijf om naam, KVK-nummer, locatie,
            oprichtingsjaar en sector automatisch in te vullen. Je kunt alle
            velden daarna nog aanpassen.
          </div>
        )}
      </div>

      {!isLinked ? (
        <div
          className="card"
          style={{ textAlign: 'center', padding: '48px 24px', background: '#FAFBFA' }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: '#fff',
              border: '1px solid var(--line)',
              marginBottom: '16px',
            }}
          >
            <BuildingIcon height={26} style={{ color: 'var(--muted)' }} width={26} />
          </div>
          <h3
            style={{
              fontFamily: "'Fraunces',serif",
              fontWeight: 500,
              fontSize: '20px',
              marginBottom: '6px',
            }}
          >
            Eerst jouw bedrijf koppelen
          </h3>
          <p
            className="text-muted"
            style={{ maxWidth: '480px', margin: '0 auto', fontSize: '13.5px', lineHeight: 1.55 }}
          >
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
