'use client'

import { useActionState, useState, useTransition } from 'react'

import {
  cancelTwoFactor,
  sendTwoFactorCode,
  updatePhoneAndResendCode,
  verifyTwoFactorCode,
} from '../../actions'
import { type AuthFlowState } from '../../types'
import { type UseTwoFactorFlow } from './types'

export const useTwoFactorFlow: UseTwoFactorFlow = ({ flowState }) => {
  const [resendResult, setResendResult] = useState<AuthFlowState | null>(null)
  const [resendError, setResendError] = useState<string | null>(null)
  const [isResending, startResendTransition] = useTransition()

  const [verifyState, verifyFormAction, isVerifying] = useActionState(
    verifyTwoFactorCode,
    { status: 'idle' },
  )
  const [phoneState, phoneFormAction, isSavingPhone] = useActionState(
    updatePhoneAndResendCode,
    { status: 'idle' },
  )

  const phoneUpdateResult =
    phoneState.status === 'twofa' || phoneState.status === 'phone-required'
      ? phoneState
      : null
  const activeState = resendResult ?? phoneUpdateResult ?? flowState
  const step =
    activeState.status === 'phone-required' ? 'phone-required' : 'twofa'
  const phoneMasked =
    activeState.status === 'twofa' ? activeState.phoneMasked : null
  const phoneError =
    phoneState.status === 'phone-required'
      ? (phoneState.error ?? null)
      : phoneState.status === 'error'
        ? phoneState.error
        : null

  const onResend = (): void => {
    setResendError(null)
    startResendTransition(async () => {
      const result = await sendTwoFactorCode()

      if (result.status === 'error') {
        setResendError(result.error)
        return
      }

      setResendResult(result)
    })
  }

  const onCancel = (): void => {
    void cancelTwoFactor()
  }

  return {
    isResending,
    isSavingPhone,
    isVerifying,
    onCancel,
    onResend,
    phoneError,
    phoneFormAction,
    phoneMasked,
    resendError,
    step,
    verifyFormAction,
    verifyState,
  }
}
