'use client'

import { useRouter } from 'next/navigation'
import { useTransition, type FC } from 'react'

import { useToastStore } from '@shared/store/toast'

import { startIdentityVerification } from '../../actions'

// Blocking modal shown when a customer hits /kopermatching or /verkoopproces
// without a verified identity (docx §5 "safety net"). Renders a full-screen
// overlay — the page content is not shown behind it; the caller (the guard)
// mounts this instead of children when the check fails.
//
// "Later" navigates back to /dashboard (docx: "leads to verification instead
// of showing the page"). "Start verificatie" kicks off the Stripe hosted
// flow and redirects to the returned URL.

const LockIcon: FC = () => (
  <svg
    fill="none"
    height="26"
    stroke="currentColor"
    strokeLinecap="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="26"
  >
    <rect height="9" rx="2" width="14" x="5" y="11" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
)

export const IdentityRequiredModal: FC = () => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const showToast = useToastStore(state => state.showToast)

  const onLater = (): void => {
    router.push('/dashboard')
  }

  const onStart = (): void => {
    startTransition(async () => {
      const result = await startIdentityVerification()
      if (result.error !== null || !result.url) {
        showToast(result.error ?? 'Verificatie starten mislukt.', 'error')
        return
      }
      window.location.href = result.url
    })
  }

  return (
    <div className="identity-modal-overlay">
      <div className="identity-modal">
        <div className="identity-modal-icon">
          <LockIcon />
        </div>
        <h3>Verifieer eerst je identiteit</h3>
        <p>
          Om je bedrijf in de markt te zetten en contact te leggen met
          kopers, moeten we eerst je identiteit vaststellen. Dit duurt
          ongeveer 2 minuten.
        </p>
        <div className="identity-modal-actions">
          <button
            className="btn btn-secondary"
            onClick={onLater}
            type="button"
          >
            Later
          </button>
          <button
            className="btn btn-primary"
            disabled={isPending}
            onClick={onStart}
            type="button"
          >
            {isPending ? 'Bezig...' : 'Start verificatie'}
          </button>
        </div>
      </div>
    </div>
  )
}
