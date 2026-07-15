import { type FC } from 'react'

import { cn } from '@shared/utils/cn'

import { type Props } from './types'

export const AuthTextInput: FC<Props> = ({ className, ref, ...rest }) => {
  return (
    <input
      ref={ref}
      className={cn(
        `
          w-full rounded-md border border-border bg-surface px-3.5 py-3
          transition-[border-color,box-shadow] duration-150
          focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,179,60,0.1)]
          focus:outline-none
        `,
        className,
      )}
      {...rest}
    />
  )
}
