'use client'

import { type FC } from 'react'

import { saveSmallEbitdaDeductions } from '../../../actions'
import {
  DeductionRangesCard,
  type DeductionRangeValue,
} from '../DeductionRangesCard'
import { type Props } from './types'

export const SmallEbitdaDeductionsCard: FC<Props> = ({ deductions }) => {
  const initialRows = deductions.map(deduction => ({
    deduction: deduction.deduction,
    from: deduction.fromEbitda,
    to: deduction.toEbitda,
  }))

  const onSave = (
    rows: DeductionRangeValue[],
  ): ReturnType<typeof saveSmallEbitdaDeductions> =>
    saveSmallEbitdaDeductions(
      rows.map(row => ({
        deduction: row.deduction,
        fromEbitda: row.from,
        toEbitda: row.to,
      })),
    )

  return (
    <DeductionRangesCard
      description="Configureer aftrekwaardes per EBITDA-bereik. Bedrijven met een EBITDA binnen het bereik krijgen de bijbehorende aftrek toegepast op de waardebepaling."
      fromLabel="Van EBITDA"
      initialRows={initialRows}
      isEuro
      onSave={onSave}
      successMessage="Aftrek kleine EBITDA bijgewerkt."
      title="Aftrek kleine EBITDA"
      toLabel="Tot EBITDA"
    />
  )
}
