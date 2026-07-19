import { type FC } from 'react'

import { type Props } from './types'

export const AccountFormSubmitButton: FC<Props> = ({
  children,
  isDisabled,
}) => {
  return (
    <div className="flex" style={{ justifyContent: 'flex-end' }}>
      <button className="btn btn-primary" disabled={isDisabled} type="submit">
        {children}
      </button>
    </div>
  )
}
