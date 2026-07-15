import { type FC } from 'react'

import { type Props } from './types'

export const AuthSubtitle: FC<Props> = ({ children }) => {
  return <p className="mb-8 text-muted-foreground">{children}</p>
}
