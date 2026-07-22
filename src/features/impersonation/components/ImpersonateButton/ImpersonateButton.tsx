'use client'

import { type EmailOtpType } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useState, type FC } from 'react'

import { useToastStore } from '@shared/store/toast'
import { getBrowserClient } from '@shared/supabase/browser'
import { cn } from '@shared/utils/cn'

import { exitImpersonation, startImpersonation } from '../../actions'
import {
  ADMIN_SESSION_STORAGE_KEY,
  DEFAULT_OTP_TYPE,
  IMPERSONATE_BUTTON_LABEL,
  IMPERSONATION_FAILED_MESSAGE,
  NO_ADMIN_SESSION_MESSAGE,
} from '../../constants'
import { type Props } from './types'

export const ImpersonateButton: FC<Props> = ({
  className,
  customerName,
  label = IMPERSONATE_BUTTON_LABEL,
  userId,
  withIcon = false,
}) => {
  const router = useRouter()
  const showToast = useToastStore(state => state.showToast)
  const [isPending, setIsPending] = useState(false)

  const onClick = async (): Promise<void> => {
    setIsPending(true)
    const supabase = getBrowserClient()

    try {
      const {
        data: { session: adminSession },
      } = await supabase.auth.getSession()

      if (!adminSession) {
        showToast(NO_ADMIN_SESSION_MESSAGE, 'error')
        return
      }

      // Park the admin's tokens browser-side so the banner can restore the
      // admin session on exit (legacy sessionStorage['osago.admin.session']).
      // Known tradeoff: a JWT-bearing admin token lives in browser storage,
      // exactly as legacy — flagged, not fixed, per the replicate-exactly rule.
      sessionStorage.setItem(
        ADMIN_SESSION_STORAGE_KEY,
        JSON.stringify({
          access_token: adminSession.access_token,
          adminId: adminSession.user.id,
          refresh_token: adminSession.refresh_token,
        }),
      )

      const result = await startImpersonation(userId)

      if (!result.ok) {
        sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY)
        showToast(result.error, 'error')
        return
      }

      // Real identity swap: after verifyOtp, auth.uid() is the customer and all
      // reads/writes run under the customer's own RLS.
      const { error } = await supabase.auth.verifyOtp({
        token_hash: result.tokenHash,
        type: (result.type || DEFAULT_OTP_TYPE) as EmailOtpType,
      })

      if (error) {
        sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY)
        await exitImpersonation()
        showToast(`${IMPERSONATION_FAILED_MESSAGE} ${error.message}`, 'error')
        return
      }

      showToast(
        customerName
          ? `Je bent nu ingelogd als ${customerName}.`
          : 'Je bent nu ingelogd als klant.',
      )
      router.push('/dashboard')
      router.refresh()
    } catch {
      sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY)
      showToast(IMPERSONATION_FAILED_MESSAGE, 'error')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <button
      className={cn(className ?? 'btn btn-primary btn-sm')}
      disabled={isPending}
      onClick={() => void onClick()}
      title="Inloggen als deze klant"
      type="button"
    >
      {withIcon && (
        <svg
          fill="none"
          height="14"
          stroke="currentColor"
          strokeWidth="2"
          style={{ marginRight: 4, verticalAlign: -2 }}
          viewBox="0 0 24 24"
          width="14"
        >
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
        </svg>
      )}
      {label}
    </button>
  )
}
