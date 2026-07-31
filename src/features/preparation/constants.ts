import {
  type PreparationGroupId,
  type PreparationScreenId,
} from './types'

// Journey-order screens for the preparation dashboard + sidebar. The order
// matters — computePreparationState marks the first non-done screen as
// "current" and locks everything after it, per docx §3: "There is always
// exactly one active step."
//
// A screen only appears once (`waarderingsrapport` covers both the report-
// data commentary and the PDF-in-vault step from the docx table — the
// mockup consolidates them into one nav item).
export const PREPARATION_SCREENS: ReadonlyArray<{
  group: PreparationGroupId
  id: PreparationScreenId
  label: string
  path: string
}> = [
  {
    group: 'bedrijf',
    id: 'mijn-bedrijf',
    label: 'Mijn bedrijf',
    path: '/mijn-bedrijf',
  },
  {
    group: 'waardering',
    id: 'financiele-gegevens',
    label: 'Financiële gegevens',
    path: '/financiele-gegevens',
  },
  {
    group: 'waardering',
    id: 'value-drivers',
    label: 'Value drivers',
    path: '/value-drivers',
  },
  {
    group: 'waardering',
    id: 'waardebepaling',
    label: 'Waardebepaling',
    path: '/waardebepaling',
  },
  {
    group: 'waardering',
    id: 'waarderingsrapport',
    label: 'Waarderingsrapport',
    path: '/waarderingsrapport',
  },
  {
    group: 'presentatie',
    id: 'presentatie',
    label: 'Presentatie',
    path: '/verkooppresentatie',
  },
]

export const PREPARATION_GROUPS: ReadonlyArray<{
  id: PreparationGroupId
  label: string
  stepNumber: number
}> = [
  { id: 'bedrijf', label: 'Je bedrijf', stepNumber: 1 },
  { id: 'waardering', label: 'Waardering', stepNumber: 2 },
  { id: 'presentatie', label: 'Verkooppresentatie', stepNumber: 3 },
]
