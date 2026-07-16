import { type FC } from 'react'

import { type Props } from './types'

export const KvkFieldBadge: FC<Props> = ({ field, kvkPrefilled }) => {
  if (!kvkPrefilled.includes(field)) {
    return null
  }

  return (
    <span
      className={`
        ml-1.5 rounded-sm bg-primary-light px-1.5 py-0.5 text-[11px] font-medium
        text-primary
      `}
      title="Automatisch ingevuld via KVK Handelsregister"
    >
      via KVK
    </span>
  )
}
