import { type FC } from 'react'

import { type Props } from './types'

export const AuthHeading: FC<Props> = ({ children }) => {
  return (
    <h2>{children}</h2>
  )
}
