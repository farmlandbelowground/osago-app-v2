'use client'

import { type FC } from 'react'

import { ModalShell } from '@shared/components/ModalShell'

import { ADMIN_RESET_FEE } from '../../constants'
import { type Props } from './types'

// Ports the 3-button admin-reset modal (osago-bundle.js:12583-12598): Annuleren
// / Reset zonder factuur / Reset en factuur maken, with the €199 heraanmaak-fee
// amber notice.
export const AdminResetModal: FC<Props> = ({
  isPending,
  message,
  onClose,
  onReset,
  title,
}) => {
  const footer = (
    <>
      <button
        className="btn btn-secondary"
        disabled={isPending}
        onClick={onClose}
        type="button"
      >
        Annuleren
      </button>
      <button
        className="btn btn-secondary"
        disabled={isPending}
        onClick={() => void onReset(false)}
        type="button"
      >
        Reset zonder factuur
      </button>
      <button
        className="btn btn-primary"
        disabled={isPending}
        onClick={() => void onReset(true)}
        type="button"
      >
        Reset en factuur maken
      </button>
    </>
  )

  return (
    <ModalShell footer={footer} onClose={onClose} title={title}>
      <p className="mb-4">{message}</p>
      <div className="alert alert-amber">
        <strong style={{ color: '#92400E' }}>Heraanmaak-fee:</strong> Osago
        hanteert een tarief van <strong>€ {ADMIN_RESET_FEE},-</strong> (excl.
        BTW) voor een handmatige heraanmaak. Bepaal of die kosten in rekening
        moeten worden gebracht. Bij <em>&quot;Reset en factuur maken&quot;</em>{' '}
        wordt automatisch een open factuur aangemaakt voor de klant.
      </div>
    </ModalShell>
  )
}
