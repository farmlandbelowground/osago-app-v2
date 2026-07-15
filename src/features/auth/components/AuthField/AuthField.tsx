import { type FC } from 'react'

import { type Props } from './types'

export const AuthField: FC<Props> = ({ children, label }) => {
  return (
    <label className="mb-[18px] flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-foreground-secondary">
        {label}
      </span>
      {children}
    </label>
  )
}
