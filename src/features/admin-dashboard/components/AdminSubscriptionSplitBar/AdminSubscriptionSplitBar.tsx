import { type FC } from 'react'

import { SPLIT_BAR_ZONDER_COLOR } from '../../constants'
import { type Props } from './types'

// Ports the met/zonder-abonnement split (osago-bundle.js:24998) — always
// current/unfiltered.
export const AdminSubscriptionSplitBar: FC<Props> = ({
  pctMet,
  pctZonder,
  totalUsers,
  usersWithActiveSub,
}) => {
  return (
    <>
      <div style={{ alignItems: 'stretch', display: 'flex', gap: 18 }}>
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-sm)',
            flex: 1,
            padding: 14,
          }}
        >
          <div
            className="text-xs text-muted fw-600"
            style={{ letterSpacing: '0.05em', textTransform: 'uppercase' }}
          >
            Met abonnement
          </div>
          <div
            className="stat-value"
            style={{ color: 'var(--green-dark)', fontSize: 28, marginTop: 4 }}
          >
            {pctMet}%
          </div>
          <div className="stat-meta">
            {usersWithActiveSub} van {totalUsers} gebruikers
          </div>
        </div>
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-sm)',
            flex: 1,
            padding: 14,
          }}
        >
          <div
            className="text-xs text-muted fw-600"
            style={{ letterSpacing: '0.05em', textTransform: 'uppercase' }}
          >
            Zonder abonnement
          </div>
          <div
            className="stat-value"
            style={{ color: 'var(--ink)', fontSize: 28, marginTop: 4 }}
          >
            {pctZonder}%
          </div>
          <div className="stat-meta">
            {totalUsers - usersWithActiveSub} van {totalUsers} gebruikers
          </div>
        </div>
      </div>
      <div
        style={{
          background: 'var(--line-soft)',
          borderRadius: 99,
          display: 'flex',
          height: 10,
          marginTop: 18,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: 'var(--green)',
            height: '100%',
            transition: 'width .3s',
            width: `${pctMet}%`,
          }}
        />
        <div
          style={{
            background: SPLIT_BAR_ZONDER_COLOR,
            height: '100%',
            transition: 'width .3s',
            width: `${pctZonder}%`,
          }}
        />
      </div>
    </>
  )
}
