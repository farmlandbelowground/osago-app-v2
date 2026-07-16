'use client'

import { type FC } from 'react'

import { useToastStore } from '@shared/store/toast'
import { cn } from '@shared/utils/cn'

export const ToastViewport: FC = () => {
  const toasts = useToastStore(state => state.toasts)

  return (
    <div className="fixed right-6 bottom-6 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          className={cn(
            `
              max-w-[340px] rounded-md px-4.5 py-3 text-[13.5px]
              text-primary-foreground shadow-lg
            `,
            toast.variant === 'success' && 'bg-primary-hover',
            toast.variant === 'error' && 'bg-destructive',
          )}
          key={toast.id}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
