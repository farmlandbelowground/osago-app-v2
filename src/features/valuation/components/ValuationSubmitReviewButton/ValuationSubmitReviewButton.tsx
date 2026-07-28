'use client'

import { useRouter } from 'next/navigation'
import { useState, type FC } from 'react'

import { useToastStore } from '@shared/store/toast'

import { submitValuationForReview } from '../../actions'

export const ValuationSubmitReviewButton: FC = () => {
  const router = useRouter()
  const showToast = useToastStore(state => state.showToast)
  const [isPending, setIsPending] = useState(false)

  const onClick = async (): Promise<void> => {
    setIsPending(true)
    const result = await submitValuationForReview()
    setIsPending(false)

    if (result.error !== null) {
      showToast(result.error, 'error')
      return
    }

    router.refresh()
  }

  return (
    <button
      className="btn btn-primary"
      disabled={isPending}
      onClick={() => void onClick()}
      type="button"
    >
      Indienen ter controle
    </button>
  )
}
