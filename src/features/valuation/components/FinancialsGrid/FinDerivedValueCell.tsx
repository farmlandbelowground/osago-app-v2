import { type FC } from 'react'

import { cn } from '@shared/utils/cn'

interface Props {
  value: number | null
}

export const FinDerivedValueCell: FC<Props> = ({ value }) => {
  const isZero = value === null || value === 0

  return (
    <span className={cn('fin-derived-value', isZero && 'zero')}>
      {value === null ? '' : Math.round(value).toLocaleString('nl-NL')}
    </span>
  )
}
