'use client'

import { useRouter } from 'next/navigation'
import { useState, type FC } from 'react'

import { useToastStore } from '@shared/store/toast'

import { approveValuationReviewByAdmin } from '../../../actions'

export const ValuationUnlockButton: FC = () => {
  const router = useRouter()
  const showToast = useToastStore(state => state.showToast)
  const [isPending, setIsPending] = useState(false)

  const onClick = async (): Promise<void> => {
    setIsPending(true)
    const result = await approveValuationReviewByAdmin()
    setIsPending(false)

    if (result.error) {
      showToast(result.error, 'error')
      return
    }

    showToast('Waardebepaling vrijgeschakeld — klant heeft bericht gekregen.')
    router.refresh()
  }

  return (
    <button
      className="btn btn-secondary btn-medewerker"
      disabled={isPending}
      onClick={() => void onClick()}
      type="button"
    >
      Vrijschakelen (medewerker)
    </button>
  )
}
