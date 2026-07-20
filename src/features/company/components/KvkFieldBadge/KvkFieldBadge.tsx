import { type FC } from 'react'

import { type Props } from './types'

export const KvkFieldBadge: FC<Props> = ({ field, kvkPrefilled }) => {
  if (!kvkPrefilled.includes(field)) {
    return null
  }

  return (
    <span
      className="kvk-prefilled"
      title="Automatisch ingevuld via KVK Handelsregister"
    >
      via KVK
    </span>
  )
}
