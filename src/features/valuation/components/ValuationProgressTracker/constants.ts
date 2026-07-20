import { type ProgressStepDefinition } from './types'

export const PROGRESS_STEPS: readonly ProgressStepDefinition[] = [
  { label: 'Financiële gegevens', progressKey: 'financialsAnyValue' },
  { label: 'Value drivers', progressKey: 'valueDriversComplete' },
  { label: 'Waardering maken', progressKey: 'valuationMade' },
  { label: 'Waarderingsrapport', progressKey: 'valuationReportStarted' },
  { label: 'Rapport in kluis', progressKey: 'hasValuationPdfInVault' },
] as const
