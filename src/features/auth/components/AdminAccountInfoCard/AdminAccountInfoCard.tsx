import { type FC } from 'react'

import { formatMemberSince } from '../../lib/formatMemberSince'
import { type Props } from './types'

export const AdminAccountInfoCard: FC<Props> = ({ createdAt, id }) => {
  return (
    <div className="rounded-lg border border-border bg-[#FAFBFA] p-6">
      <h3 className="font-serif text-[17px] font-medium text-foreground">
        Account-informatie
      </h3>
      <p className="mb-4 text-[13.5px] text-muted-foreground">
        Voor identificatie of supportvragen.
      </p>
      <div
        className={`
          grid grid-cols-2 gap-2 text-[13px]
          max-[700px]:grid-cols-1
        `}
      >
        <div>
          <span className="text-muted-foreground">Account ID:</span>{' '}
          <span className="font-mono">{id}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Rol:</span>{' '}
          <strong>Beheerder</strong>
        </div>
        {createdAt && (
          <div>
            <span className="text-muted-foreground">Lid sinds:</span>{' '}
            {formatMemberSince(createdAt)}
          </div>
        )}
      </div>
    </div>
  )
}
