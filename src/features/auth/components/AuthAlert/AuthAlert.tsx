import { type FC } from 'react'

import { cn } from '@shared/utils/cn'

import { type Props } from './types'

export const AuthAlert: FC<Props> = ({ children, variant }) => {
  return (
    <div
      className={cn(
        'mb-4 rounded-md border px-3.5 py-3 text-[13px]',
        variant === 'error' &&
          'border-destructive/30 bg-destructive/10 text-destructive',
        variant === 'info' && 'border-info/30 bg-info/10 text-info',
        variant === 'success' &&
          'border-primary/30 bg-primary-soft text-foreground',
      )}
    >
      {children}
    </div>
  )
}
