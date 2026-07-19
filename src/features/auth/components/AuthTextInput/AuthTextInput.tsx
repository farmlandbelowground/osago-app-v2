import { type FC } from 'react'

import { cn } from '@shared/utils/cn'

import { type Props } from './types'

export const AuthTextInput: FC<Props> = ({ className, ref, ...rest }) => {
  return <input ref={ref} className={cn(className)} {...rest} />
}
