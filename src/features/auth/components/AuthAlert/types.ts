import { type ReactNode } from 'react'

export type AuthAlertVariant = 'error' | 'info' | 'success'

export interface Props {
  children: ReactNode
  variant: AuthAlertVariant
}
