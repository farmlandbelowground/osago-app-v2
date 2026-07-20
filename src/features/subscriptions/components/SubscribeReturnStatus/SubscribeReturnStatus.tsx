import Link from 'next/link'
import { type FC } from 'react'

import { ABONNEMENT_AFSLUITEN_PATH } from '../../constants'
import { type Props } from './types'

export const SubscribeReturnStatus: FC<Props> = ({ error }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        padding: '80px 0',
        textAlign: 'center',
      }}
    >
      <svg
        fill="none"
        height="36"
        stroke="var(--danger)"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="36"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" x2="12" y1="8" y2="12" />
        <line x1="12" x2="12.01" y1="16" y2="16" />
      </svg>
      <div className="serif" style={{ fontSize: 20, fontWeight: 500 }}>
        Abonnement kon niet worden geactiveerd
      </div>
      <div className="text-muted text-sm" style={{ maxWidth: 400 }}>
        De betaling is voltooid, maar de activatie is nog niet doorgekomen. Klik
        opnieuw om te herproberen — dat is veilig en dubbele activatie is niet
        mogelijk.
      </div>
      {error && (
        <div
          className="text-xs"
          style={{
            color: 'var(--muted)',
            fontFamily: 'monospace',
            maxWidth: 600,
            wordBreak: 'break-word',
            background: '#F4F4F2',
            padding: '8px 12px',
            borderRadius: 6,
          }}
        >
          {error}
        </div>
      )}
      <Link
        className="btn btn-primary"
        href={`${ABONNEMENT_AFSLUITEN_PATH}?paid=1`}
        style={{ marginTop: 8 }}
      >
        Opnieuw proberen
      </Link>
    </div>
  )
}
