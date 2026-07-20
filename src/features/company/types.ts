import { type LEGAL_FORM_OPTIONS } from './constants'

export type LegalForm = (typeof LEGAL_FORM_OPTIONS)[number]

export interface Company {
  bedrijfMarktOntwikkeling: number | null
  city: string
  description: string
  employees: number | null
  founded: number | null
  houseNumber: string
  houseNumberExtra: string
  kvkNummer: string | null
  kvkPrefilled: string[]
  legalForm: string
  logo: string | null
  name: string
  netProfit: number | null
  postalCode: string
  reasonForSale: string
  recurringRevenue: number | null
  sector: string
  street: string
  userId: string
  usp: string
  vestigingsnummer: string | null
  website: string
}

// The subset of Company fields KVK search/basisprofiel can prefill, plus the
// KVK link itself — the typed equivalent of legacy's selectKvkResult prefill
// object (osago-bundle.js:8330-8393). Values are left `undefined` when KVK
// has no data for that field, matching legacy's "only set what KVK returned".
export interface KvkMergeableFields {
  city?: string
  employees?: number
  founded?: number
  houseNumber?: string
  houseNumberExtra?: string
  kvkNummer?: string
  name?: string
  postalCode?: string
  sector?: string
  street?: string
  vestigingsnummer?: string | null
  website?: string
}

export interface SectorOption {
  id: string
  label: string
  value: number
  sectoropslag?: number
}

export interface BuildKvkPrefillResult {
  conflicts: string[]
  prefill: KvkMergeableFields
}

export interface MergeKvkPrefillResult {
  kvkPrefilled: string[]
  merged: KvkMergeableFields
}
