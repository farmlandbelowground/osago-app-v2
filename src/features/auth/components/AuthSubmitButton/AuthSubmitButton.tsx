import { type FC } from 'react'

import { type Props } from './types'

export const AuthSubmitButton: FC<Props> = ({ children, isDisabled }) => {
  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={`
        inline-flex w-full items-center justify-center gap-2 rounded-md
        bg-primary px-6 py-3.5 text-[15px] font-semibold text-primary-foreground
        transition
        hover:-translate-y-px hover:bg-primary-hover
        hover:shadow-[0_4px_12px_rgba(0,179,60,0.25)]
        disabled:opacity-50 disabled:hover:translate-y-0
        disabled:hover:shadow-none
      `}
    >
      {children}
    </button>
  )
}
