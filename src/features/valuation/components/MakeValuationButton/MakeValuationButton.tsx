'use client'

import { useState, type FC } from 'react'

import { ValuationLockInModal } from '../ValuationLockInModal'

export const MakeValuationButton: FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        className="btn btn-primary"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        Waardering maken
      </button>
      <ValuationLockInModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
