'use client'

import { type FC } from 'react'

import { cn } from '@shared/utils/cn'

import { type Props } from './types'

export const ModalShell: FC<Props> = ({
  children,
  maxWidthClassName,
  onClose,
  title,
}) => {
  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4
      `}
      onClick={onClose}
    >
      <div
        className={cn(
          `
            max-h-[90vh] w-full overflow-y-auto rounded-lg border border-border
            bg-surface p-6 shadow-lg
          `,
          maxWidthClassName ?? 'max-w-lg',
        )}
        onClick={event => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-serif text-lg font-medium text-foreground">
            {title}
          </h2>
          <button
            aria-label="Sluiten"
            className={`
              text-muted-foreground
              hover:text-foreground
            `}
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
