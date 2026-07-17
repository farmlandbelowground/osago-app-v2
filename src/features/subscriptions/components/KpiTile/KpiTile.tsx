import { type FC } from 'react'

import { cn } from '@shared/utils/cn'

import { type Props } from './types'

export const KpiTile: FC<Props> = ({ label, meta, value, valueClassName }) => {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          `
            mt-1 font-serif text-[32px] leading-none font-medium
            tracking-[-0.02em] text-foreground
          `,
          valueClassName,
        )}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground-soft">{meta}</div>
    </div>
  )
}
