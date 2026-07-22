'use client'

import { useRouter } from 'next/navigation'
import { type FC, useState } from 'react'

import { OVERLAY_Z_INDEX, SIDEBAR_WIDTH_PX } from '../../constants'
import { BookingFlow } from '../BookingFlow'
import { type Props } from './types'

export const InAppBookingLauncher: FC<Props> = ({
  label,
  prefill,
  slots,
  type,
}) => {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const onClose = (): void => {
    setIsOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        className="btn btn-primary btn-sm"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <svg
          fill="none"
          height="13"
          stroke="currentColor"
          strokeWidth="2"
          style={{ marginRight: 4, verticalAlign: -2 }}
          viewBox="0 0 24 24"
          width="13"
        >
          <line x1="12" x2="12" y1="5" y2="19" />
          <line x1="5" x2="19" y1="12" y2="12" />
        </svg>
        {label}
      </button>

      {isOpen && (
        <div
          style={{
            background: 'var(--bg)',
            bottom: 0,
            left: SIDEBAR_WIDTH_PX,
            overflowY: 'auto',
            padding: '24px 16px',
            position: 'fixed',
            right: 0,
            top: 0,
            zIndex: OVERLAY_Z_INDEX,
          }}
        >
          <BookingFlow
            onClose={onClose}
            prefill={prefill}
            slots={slots}
            type={type}
            variant="overlay"
          />
        </div>
      )}
    </>
  )
}
