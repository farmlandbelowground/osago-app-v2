import { type FC } from 'react'

import { type Props } from './types'

export const AuthField: FC<Props> = ({ children, label }) => {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  )
}
