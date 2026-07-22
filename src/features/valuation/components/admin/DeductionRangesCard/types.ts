export interface DeductionRangeValue {
  deduction: number
  from: number | null
  to: number | null
}

export interface Props {
  description: string
  fromLabel: string
  initialRows: DeductionRangeValue[]
  isEuro: boolean
  onSave: (
    rows: DeductionRangeValue[],
  ) => Promise<{ error: null } | { error: string }>
  successMessage: string
  title: string
  toLabel: string
}
