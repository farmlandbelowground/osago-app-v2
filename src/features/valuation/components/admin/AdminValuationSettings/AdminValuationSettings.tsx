import { type FC } from 'react'

import { DcfDefaultsCard } from '../DcfDefaultsCard'
import { SmallEbitdaDeductionsCard } from '../SmallEbitdaDeductionsCard'
import { SmallOrgDeductionsCard } from '../SmallOrgDeductionsCard'
import { ValuationMultiplesCard } from '../ValuationMultiplesCard'
import { type Props } from './types'

export const AdminValuationSettings: FC<Props> = ({
  dcfDefaults,
  ebitdaDeductions,
  multiples,
  orgDeductions,
}) => {
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Valuation</h1>
        </div>
      </div>
      <DcfDefaultsCard defaults={dcfDefaults} />
      <ValuationMultiplesCard multiples={multiples} />
      <SmallEbitdaDeductionsCard deductions={ebitdaDeductions} />
      <SmallOrgDeductionsCard deductions={orgDeductions} />
    </>
  )
}
