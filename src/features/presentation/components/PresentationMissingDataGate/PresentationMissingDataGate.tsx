import Link from 'next/link'
import { type FC } from 'react'

import { type Props } from './types'

// Ports the blocked empty-state of renderPresentationExtended
// (osago-bundle.js:18490-18503). The header title is verbatim "Verkoopmemorandum"
// (legacy shows that on the gate, not "Presentatie").
export const PresentationMissingDataGate: FC<Props> = ({
  ctaHref,
  ctaLabel,
  message,
}) => (
  <main className="main">
    <div className="page-header">
      <div>
        <h1 className="page-title">Verkoopmemorandum</h1>
      </div>
    </div>
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
            <rect height="14" rx="2" width="20" x="2" y="4" />
            <path d="M2 8h20M8 18l-2 4M16 18l2 4M12 18v4" />
          </svg>
        </div>
        <h3>Aanvullende gegevens nodig</h3>
        <p>
          Met de gegevens uit jouw profiel stellen we automatisch een
          professioneel verkoopmemorandum samen. {message}
        </p>
        <Link className="btn btn-primary" href={ctaHref}>
          {ctaLabel}
        </Link>
      </div>
    </div>
  </main>
)
