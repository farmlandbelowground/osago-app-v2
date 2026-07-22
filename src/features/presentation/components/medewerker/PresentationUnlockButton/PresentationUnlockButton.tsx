'use client'

import { useRouter } from 'next/navigation'
import { useState, type FC } from 'react'

import { useToastStore } from '@shared/store/toast'

import { approvePresentationReviewByAdmin } from '../../../actions'

// "Vrijschakelen (medewerker)" — approves the submitted presentation review so
// the customer's downloads unlock. Renders only while impersonating.
export const PresentationUnlockButton: FC = () => {
  const router = useRouter()
  const showToast = useToastStore(state => state.showToast)
  const [isPending, setIsPending] = useState(false)

  const onClick = async (): Promise<void> => {
    setIsPending(true)
    const result = await approvePresentationReviewByAdmin()
    setIsPending(false)

    if (result.error) {
      showToast(result.error, 'error')
      return
    }

    showToast('Presentatie vrijgeschakeld — klant heeft bericht gekregen.')
    router.refresh()
  }

  return (
    <button
      className="btn btn-secondary btn-medewerker"
      disabled={isPending}
      onClick={() => void onClick()}
      title="Alleen voor medewerkers — schakelt de downloads vrij"
      type="button"
    >
      Vrijschakelen (medewerker)
    </button>
  )
}
