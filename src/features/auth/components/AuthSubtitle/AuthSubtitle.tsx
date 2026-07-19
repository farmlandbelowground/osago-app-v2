import { type FC } from 'react'

import { type Props } from './types'

export const AuthSubtitle: FC<Props> = ({ children }) => {
  return <p className="sub">{children}</p>
}
