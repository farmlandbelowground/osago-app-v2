'use client'

import { useState, type FC } from 'react'

import { ValuationReviewUpsellModal } from '../ValuationReviewUpsellModal'

export const ValuationReviewUpsellButton: FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        className="btn btn-secondary"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        Controle door Osago aanvragen
      </button>
      <ValuationReviewUpsellModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}
