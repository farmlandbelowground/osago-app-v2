import { type DcfNewBerekeningRow } from '@features/valuation/types'

export type DcfExtraRowKey = Extract<
  keyof DcfNewBerekeningRow,
  'ebit' | 'noplat' | 'investeringen' | 'aflossingen' | 'fcf' | 'df' | 'cw'
>

interface DcfExtraRowDefinition {
  key: DcfExtraRowKey
  label: string
  // Non-monetary 3-decimal ratio (Disconteringsvoet) — suppresses the € prefix.
  dec3?: boolean
  // Editable input row (writes into dcfNewInputs); otherwise derived/read-only.
  editable?: boolean
  // Only rendered when the "Uitgebreide data tonen" toggle is on.
  extended?: boolean
}

// Ports legacy buildFinDcfExtras' extraRows (osago-bundle.js:8530-8540):
// EBIT/NOPLAT lead the block but only when "Uitgebreide data tonen" is on.
export const FIN_DCF_EXTRA_ROWS: readonly DcfExtraRowDefinition[] = [
  { key: 'ebit', label: 'EBIT', extended: true },
  { key: 'noplat', label: 'NOPLAT', extended: true },
  { editable: true, key: 'investeringen', label: 'Investeringen' },
  { editable: true, key: 'aflossingen', label: 'Aflossingen' },
  { key: 'fcf', label: 'Free cash flow' },
  { dec3: true, key: 'df', label: 'Disconteringsvoet' },
  { key: 'cw', label: 'Contante waarde free cash flow' },
]
