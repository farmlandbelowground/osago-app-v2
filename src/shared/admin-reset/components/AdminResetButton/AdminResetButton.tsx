'use client'

import { useRouter } from 'next/navigation'
import { useState, type FC } from 'react'

import { useToastStore } from '@shared/store/toast'

import { ADMIN_RESET_CONFIG, ADMIN_RESET_FEE } from '../../constants'
import { AdminResetModal } from '../AdminResetModal'
import { type Props } from './types'

export const AdminResetButton: FC<Props> = ({
  label,
  resetAction,
  resetType,
}) => {
  const router = useRouter()
  const showToast = useToastStore(state => state.showToast)
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const config = ADMIN_RESET_CONFIG[resetType]

  const onReset = async (withInvoice: boolean): Promise<void> => {
    setIsPending(true)

    try {
      const { invoiceError } = await resetAction(withInvoice)

      if (withInvoice && invoiceError) {
        showToast(
          `Reset is doorgevoerd, maar factuur-creatie is mislukt: ${invoiceError}`,
          'error',
        )
      }

      showToast(
        withInvoice
          ? `${config.successToast} Factuur bij Mollie aangemaakt (€ ${ADMIN_RESET_FEE},-).`
          : config.successToast,
      )
      setIsOpen(false)
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <button
        className="btn btn-secondary btn-medewerker"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        {label}
      </button>
      {isOpen && (
        <AdminResetModal
          isPending={isPending}
          message={config.message}
          onClose={() => setIsOpen(false)}
          onReset={onReset}
          title={config.title}
        />
      )}
    </>
  )
}
