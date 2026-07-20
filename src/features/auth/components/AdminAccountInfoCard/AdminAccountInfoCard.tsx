import { type FC } from 'react'

import { formatMemberSince } from '../../lib/formatMemberSince'
import { type Props } from './types'

export const AdminAccountInfoCard: FC<Props> = ({ createdAt, id }) => {
  return (
    <div className="card" style={{ background: '#FAFBFA' }}>
      <h3>Account-informatie</h3>
      <p className="desc">Voor identificatie of supportvragen.</p>
      <div className="grid-2 grid" style={{ fontSize: 13, gap: 8 }}>
        <div>
          <span className="text-muted">Account ID:</span>{' '}
          <span style={{ fontFamily: 'monospace' }}>{id}</span>
        </div>
        <div>
          <span className="text-muted">Rol:</span> <strong>Beheerder</strong>
        </div>
        {createdAt && (
          <div>
            <span className="text-muted">Lid sinds:</span>{' '}
            {formatMemberSince(createdAt)}
          </div>
        )}
      </div>
    </div>
  )
}
