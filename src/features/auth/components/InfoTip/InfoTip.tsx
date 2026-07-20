import { type FC } from 'react'

import { type Props } from './types'

export const InfoTip: FC<Props> = ({ tip }) => {
  return (
    <span
      aria-label="Wachtwoordeisen"
      className="info-tip"
      data-tip={tip}
      role="button"
      tabIndex={0}
    >
      i
    </span>
  )
}
