'use client'

import { useState, type FormEvent } from 'react'

import { register } from '../../actions'
import { signInAndBeginTwoFactor } from '../../lib/signInAndBeginTwoFactor'
import { type AuthFlowState } from '../../types'
import { type UseRegisterFlow } from './types'

export const useRegisterFlow: UseRegisterFlow = () => {
  const [flowState, setFlowState] = useState<AuthFlowState>({ status: 'idle' })
  const [isPending, setIsPending] = useState(false)

  const submit = async (formData: FormData): Promise<void> => {
    setIsPending(true)

    try {
      const created = await register(formData)

      if (created.status === 'error') {
        setFlowState({ error: created.error, status: 'error' })
        return
      }

      setFlowState(
        await signInAndBeginTwoFactor({
          email: String(formData.get('email') ?? '')
            .trim()
            .toLowerCase(),
          password: String(formData.get('password') ?? ''),
          signInErrorMessage:
            'Account aangemaakt, maar inloggen is mislukt. Probeer in te loggen.',
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
