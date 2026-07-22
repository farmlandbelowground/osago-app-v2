'use client'

import { type FC } from 'react'

import { AdminResetButton } from '@shared/admin-reset'

import {
  resetAnonymousProfileByAdmin,
  resetMemorandumByAdmin,
} from '../../../actions'
import { type Props } from './types'

// Employee-only reset buttons — each removes the matching document from the
// customer's vault (+ optional €199 invoice + admin_reset_notice email).
export const PresentationResetButtons: FC<Props> = ({ anonDone, memoDone }) => {
  return (
    <>
      {anonDone && (
        <AdminResetButton
          label="Anoniem profiel resetten (medewerker)"
          resetAction={resetAnonymousProfileByAdmin}
          resetType="anoniem"
        />
      )}
      {memoDone && (
        <AdminResetButton
          label="Memorandum resetten (medewerker)"
          resetAction={resetMemorandumByAdmin}
          resetType="memorandum"
        />
      )}
    </>
  )
}
