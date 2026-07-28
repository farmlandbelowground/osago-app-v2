import { type FC } from 'react'

import { VALUATION_DISCLAIMER } from '../../constants/disclaimer'

export const ValuationDisclaimer: FC = () => (
  <div className="alert alert-info mt-5">
    <strong>Disclaimer:</strong> {VALUATION_DISCLAIMER}
  </div>
)
