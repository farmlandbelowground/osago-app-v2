import Link from 'next/link'
import { type FC } from 'react'

import { KOPERMATCHING_PATH } from '../../constants/routes'

// Ports the empty-pipeline state (osago-bundle.js:21539-21549).
export const PipelineEmptyState: FC = () => (
  <div className="card">
    <div className="empty">
      <div className="empty-icon">
        <svg
          fill="none"
          height="24"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
        >
          <rect height="18" rx="1" width="7" x="3" y="3" />
          <rect height="11" rx="1" width="7" x="14" y="3" />
        </svg>
      </div>
      <h3>Nog geen kopers in jouw pipeline</h3>
      <p>
        Start vanaf de Kopermatching om geschikte kopers te vinden, of voeg
        handmatig een koper toe.
      </p>
      <Link className="btn btn-primary" href={KOPERMATCHING_PATH}>
        Naar kopersmatching
      </Link>
    </div>
  </div>
)
