import { type FC } from 'react'

import { type Props } from './types'

export const AuthHeading: FC<Props> = ({ children }) => {
  return (
    <h2 className="mb-2 font-serif text-[32px] font-medium tracking-[-0.01em]">
      {children}
    </h2>
  )
}
