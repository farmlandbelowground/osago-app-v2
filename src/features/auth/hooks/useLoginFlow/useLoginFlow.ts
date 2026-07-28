'use client'

import { useState, type FormEvent } from 'react'

import { verifyTurnstileToken } from '../../actions'
import { signInAndBeginTwoFactor } from '../../lib/signInAndBeginTwoFactor'
import { LoginSchema } from '../../schema'
import { type AuthFlowState } from '../../types'
import { type UseLoginFlow } from './types'

export const useLoginFlow: UseLoginFlow = () => {
  const [flowState, setFlowState] = useState<AuthFlowState>({ status: 'idle' })
  const [isPending, setIsPending] = useState(false)

  const submit = async (formData: FormData): Promise<void> => {
    const parsed = LoginSchema.safeParse(Object.fromEntries(formData))

    if (!parsed.success) {
      setFlowState({
        error: 'Vul een geldig e-mailadres en wachtwoord in.',
        status: 'error',
      })
      return
    }

    setIsPending(true)

    try {
      const isHuman = await verifyTurnstileToken(parsed.data.turnstileToken)

      if (!isHuman) {
        setFlowState({
          error: 'Bot-verificatie mislukt. Probeer opnieuw.',
          status: 'error',
        })
        return
      }

      setFlowState(
        await signInAndBeginTwoFactor({
          email: parsed.data.email.toLowerCase(),
          password: parsed.data.password,
          signInErrorMessage: 'Onjuiste inloggegevens. Probeer het opnieuw.',
        }),
      )
    } finally {
      setIsPending(false)
    }
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    void submit(new FormData(event.currentTarget))
  }

  return { flowState, isPending, onSubmit }
}
