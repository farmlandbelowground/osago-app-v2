'use client'

import { type FC } from 'react'

import { useToastStore } from '@shared/store/toast'
import { cn } from '@shared/utils/cn'

export const ToastViewport: FC = () => {
  const toasts = useToastStore(state => state.toasts)

  return (
    <div
      style={{
        bottom: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        position: 'fixed',
        right: 24,
        zIndex: 200,
      }}
    >
      {toasts.map(toast => (
        <div
          className={cn(
            'toast',
            toast.variant === 'success' && 'success',
            toast.variant === 'error' && 'error',
          )}
          key={toast.id}
          style={{ position: 'static' }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
