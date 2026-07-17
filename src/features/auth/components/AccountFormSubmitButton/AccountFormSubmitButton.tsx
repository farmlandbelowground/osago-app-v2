import { type FC } from 'react'

import { type Props } from './types'

export const AccountFormSubmitButton: FC<Props> = ({
  children,
  isDisabled,
}) => {
  return (
    <div className="flex justify-end">
      <button
        className={`
          inline-flex items-center justify-center gap-2 rounded-md bg-primary
          px-5 py-3 text-sm font-semibold text-primary-foreground transition
          hover:-translate-y-px hover:bg-primary-hover
          hover:shadow-[0_4px_12px_rgba(0,179,60,0.25)]
          disabled:opacity-50 disabled:hover:translate-y-0
          disabled:hover:shadow-none
        `}
        disabled={isDisabled}
        type="submit"
      >
        {children}
      </button>
    </div>
  )
}
