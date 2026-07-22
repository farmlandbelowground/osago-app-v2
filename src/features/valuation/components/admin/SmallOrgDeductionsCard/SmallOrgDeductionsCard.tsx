'use client'

import { type FC } from 'react'

import { saveSmallOrgDeductions } from '../../../actions'
import {
  DeductionRangesCard,
  type DeductionRangeValue,
} from '../DeductionRangesCard'
import { type Props } from './types'

export const SmallOrgDeductionsCard: FC<Props> = ({ deductions }) => {
  const initialRows = deductions.map(deduction => ({
    deduction: deduction.deduction,
    from: deduction.fromFte,
    to: deduction.toFte,
  }))

  const onSave = (
    rows: DeductionRangeValue[],
  ): ReturnType<typeof saveSmallOrgDeductions> =>
    saveSmallOrgDeductions(
      rows.map(row => ({
        deduction: row.deduction,
        fromFte: row.from,
        toFte: row.to,
      })),
    )

  return (
    <DeductionRangesCard
      description="Configureer aftrekwaardes per FTE-bereik. Bedrijven met een aantal medewerkers binnen het bereik krijgen de bijbehorende aftrek toegepast op de waardebepaling."
      fromLabel="Van FTE"
      initialRows={initialRows}
      isEuro={false}
      onSave={onSave}
      successMessage="Aftrek kleine organisatie bijgewerkt."
      title="Aftrek kleine organisatie"
      toLabel="Tot FTE"
    />
  )
}
