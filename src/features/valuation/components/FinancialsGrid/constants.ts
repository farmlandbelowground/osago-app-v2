import { LEGAL_FORM_OPTIONS } from '@features/company/constants'

type LegalFormOption = (typeof LEGAL_FORM_OPTIONS)[number]

const EENMANSZAAK: LegalFormOption = 'Eenmanszaak'
const VOF: LegalFormOption = 'Vennootschap onder firma (V.O.F.)'

export const NON_LEGAL_ENTITY_FORMS: readonly string[] = [EENMANSZAAK, VOF]

export type FinInputField =
  | 'revenue'
  | 'cogs'
  | 'operatingExpenses'
  | 'depreciation'
  | 'interest'
  | 'taxesPaid'

export type FinDerivedField =
  'grossProfit' | 'profitBeforeTax' | 'normalizationsApplied' | 'ebitda'

interface FinInputRowDefinition {
  key: FinInputField
  kind: 'input'
  label: string
}

interface FinDerivedRowDefinition {
  key: FinDerivedField
  kind: 'derived' | 'soft-derived'
  label: string
  tooltip: string
}

export type FinRowDefinition = FinInputRowDefinition | FinDerivedRowDefinition

// Ports legacy's FIN_ROWS exactly (osago-bundle.js:8436-8450) — derived rows
// are interleaved between the raw fields they're computed from, not grouped
// at the bottom of the table.
export const FIN_ROWS: readonly FinRowDefinition[] = [
  { kind: 'input', key: 'revenue', label: 'Omzet' },
  { kind: 'input', key: 'cogs', label: 'Kostprijs van de omzet' },
  {
    kind: 'derived',
    key: 'grossProfit',
    label: 'Brutowinst',
    tooltip: 'Omzet − Kostprijs',
  },
  { kind: 'input', key: 'operatingExpenses', label: 'Bedrijfskosten' },
  {
    kind: 'derived',
    key: 'profitBeforeTax',
    label: 'Nettowinst voor belastingen',
    tooltip: 'Brutowinst − Bedrijfskosten',
  },
  { kind: 'input', key: 'depreciation', label: 'Afschrijvingen' },
  { kind: 'input', key: 'interest', label: 'Rentelasten' },
  { kind: 'input', key: 'taxesPaid', label: 'Betaalde belastingen' },
  {
    kind: 'soft-derived',
    key: 'normalizationsApplied',
    label: 'Normaliseringen',
    tooltip:
      'Som van actieve normaliseringen voor dit jaar (ingevuld in de sectie Normaliseringen). Wordt opgeteld bij EBITDA.',
  },
  {
    kind: 'derived',
    key: 'ebitda',
    label: 'EBITDA',
    tooltip:
      'Nettowinst v.b. + Afschrijvingen + Rentelasten + Belastingen + Normaliseringen',
  },
] as const

export const FIN_WEIGHT_OPTIONS = [0, 1, 2, 3, 4, 5] as const
