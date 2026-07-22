'use client'

import { useRouter } from 'next/navigation'
import { useEffect, type FC } from 'react'

import { useToastStore } from '@shared/store/toast'
import { getBrowserClient } from '@shared/supabase/browser'

import { exitImpersonation } from '../../actions'
import {
  ADMIN_SESSION_STORAGE_KEY,
  BANNER_MODE_LABEL,
  EXIT_IMPERSONATION_LABEL,
  EXIT_TO_ADMIN_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
} from '../../constants'
import { type Props } from './types'

export const ImpersonationBanner: FC<Props> = ({
  customerEmail,
  customerName,
}) => {
  const router = useRouter()
  const showToast = useToastStore(state => state.showToast)

  // Legacy toggles body.impersonating (styles.css pushes the app/sidebar down
  // by the bar height). Toggle it here for the banner's lifetime.
  useEffect(() => {
    document.body.classList.add('impersonating')

    return () => {
      document.body.classList.remove('impersonating')
    }
  }, [])

  const onExit = async (): Promise<void> => {
    const supabase = getBrowserClient()
    let isRestored = false

    try {
      const raw = sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY)
      const saved = raw ? JSON.parse(raw) : null

      if (saved?.access_token && saved?.refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: saved.access_token,
          refresh_token: saved.refresh_token,
        })
        isRestored = !error
      }
    } catch {
      isRestored = false
    }

    sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY)
    await exitImpersonation()

    if (!isRestored) {
      await supabase.auth.signOut()
      showToast(SESSION_EXPIRED_MESSAGE, 'error')
      router.push('/')
      router.refresh()
      return
    }

    showToast(EXIT_TO_ADMIN_MESSAGE)
    router.push('/admin/dashboard')
    router.refresh()
  }

  return (
    <div className="impersonate-bar">
      <div className="impersonate-bar-left">
        <div className="impersonate-bar-icon" />
        <div className="impersonate-bar-text">
          <div className="impersonate-bar-label">{BANNER_MODE_LABEL}</div>
          <div className="impersonate-bar-name">
            {customerName}
            {customerEmail && <span>· {customerEmail}</span>}
          </div>
        </div>
      </div>
      <button
        className="btn btn-primary"
        onClick={() => void onExit()}
        type="button"
      >
        <svg
          fill="none"
          height="14"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="14"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
        {EXIT_IMPERSONATION_LABEL}
      </button>
    </div>
  )
}
