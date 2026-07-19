import { type FC } from 'react'

import { type Props } from './types'

export const AuthSubmitButton: FC<Props> = ({ children, isDisabled }) => {
  return (
    <button
      type="submit"
      disabled={isDisabled}
      className="btn btn-primary btn-block btn-lg"
    >
      {children}
    </button>
  )
}
