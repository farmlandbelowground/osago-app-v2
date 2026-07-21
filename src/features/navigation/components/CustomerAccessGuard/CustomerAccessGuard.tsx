'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, type FC } from 'react'

import {
  ACCOUNT_PATH,
  EXPIRED_LOCK_MESSAGE,
  OVERDUE_LOCK_MESSAGE,
  PLAN_RESTRICTED_MESSAGE,
} from '@features/subscriptions/constants'
import {
  firstAllowedCustomerPage,
  isCustomerPageAllowed,
  lockPermitsPath,
} from '@features/subscriptions/lib/customerAccess'
import { useToastStore } from '@shared/store/toast'

import { type Props } from './types'

// Client-side equivalent of legacy's navigate() access gate (osago-bundle.js:3010-3042).
// The server layout enforces the same rules on a hard load, but a shared layout
// is NOT re-run on client-side <Link> navigation, so this guard re-checks on
// every pathname change and redirects with the matching toast. lockReason /
// allowedPaths are computed server-side and stable for the session.
export const CustomerAccessGuard: FC<Props> = ({
  allowedPaths,
  lockReason,
}) => {
  const pathname = usePathname()
  const router = useRouter()
  const showToast = useToastStore(state => state.showToast)

  useEffect(() => {
    if (lockReason && !lockPermitsPath(lockReason, pathname)) {
      showToast(
        lockReason === 'overdue' ? OVERDUE_LOCK_MESSAGE : EXPIRED_LOCK_MESSAGE,
        'error',
      )
      router.replace(ACCOUNT_PATH)
      return
    }

    if (!lockReason && !isCustomerPageAllowed(pathname, allowedPaths)) {
      showToast(PLAN_RESTRICTED_MESSAGE, 'error')
      router.replace(firstAllowedCustomerPage(allowedPaths))
    }
  }, [allowedPaths, lockReason, pathname, router, showToast])

  return null
}
