import { type FC } from 'react'

import { type Props } from './types'

export const InfoTip: FC<Props> = ({ tip }) => {
  return (
    <span
      aria-label="Wachtwoordeisen"
      className={`
        group relative ml-1.5 inline-flex h-3.5 w-3.5 cursor-help items-center
        justify-center rounded-full bg-border text-[9px] font-bold
        text-muted-foreground
        hover:bg-primary-soft hover:text-primary-hover
        focus:bg-primary-soft focus:text-primary-hover focus:outline-none
      `}
      role="button"
      tabIndex={0}
    >
      i
      <span
        className={`
          pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20
          w-max max-w-60 -translate-x-1/2 rounded-sm bg-foreground px-2.5 py-1.5
          text-[11px] leading-[1.4] font-medium text-white opacity-0 shadow-md
          transition-opacity
          group-hover:opacity-100
          group-focus:opacity-100
        `}
      >
        {tip}
      </span>
      <span
        className={`
          pointer-events-none absolute bottom-[calc(100%+3px)] left-1/2 z-20
          -translate-x-1/2 border-4 border-transparent border-t-foreground
          opacity-0 transition-opacity
          group-hover:opacity-100
          group-focus:opacity-100
        `}
      />
    </span>
  )
}
