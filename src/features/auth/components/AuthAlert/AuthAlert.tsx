import { type FC } from 'react'

import { cn } from '@shared/utils/cn'

import { type Props } from './types'

export const AuthAlert: FC<Props> = ({ children, variant }) => {
  return (
    <div
      className={cn(
        'alert',
        variant === 'error' && 'alert-error',
        variant === 'info' && 'alert-info',
        variant === 'success' && 'alert-success',
      )}
    >
      {children}
    </div>
  )
}
