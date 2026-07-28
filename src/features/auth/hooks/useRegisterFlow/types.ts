import { type FormEvent } from 'react'

import { type AuthFlowState } from '../../types'

export interface Result {
  flowState: AuthFlowState
  isPending: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export type UseRegisterFlow = () => Result
