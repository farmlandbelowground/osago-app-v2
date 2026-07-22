'use client'

import { type FC } from 'react'

import { AdminResetButton } from '@shared/admin-reset'

import { resetImprovementReportByAdmin } from '../../actions'

export const ScorecardResetButton: FC = () => {
  return (
    <AdminResetButton
      label="Verbeterrapport resetten (medewerker)"
      resetAction={resetImprovementReportByAdmin}
      resetType="verbeterrapport"
    />
  )
}
