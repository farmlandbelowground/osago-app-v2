import { type FC } from 'react'

import { AutoLeadRefreshButton } from '../AutoLeadRefreshButton'
import { LeadCard } from '../LeadCard'
import { type Props } from './types'

const Header: FC<{ hasLeads: boolean }> = ({ hasLeads }) => (
  <div
    className="flex-between mb-4"
    style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}
  >
    <div>
      <h3 style={{ margin: 0 }}>Automatisch geïdentificeerde leads</h3>
      <p className="desc" style={{ margin: '4px 0 0' }}>
        Op basis van jouw sector en regio doorzoeken onze database en openbare
        bronnen naar logische potentiële kopers.
      </p>
    </div>
    <AutoLeadRefreshButton hasLeads={hasLeads} variant="refresh" />
  </div>
)

// Ports renderAutoLeadsPanel (osago-bundle.js:21056-21100).
export const AutoLeadsPanel: FC<Props> = ({ city, leads, sector }) => {
  if (leads.length === 0) {
    return (
      <div className="card">
        <Header hasLeads={false} />
        <div
          className="empty"
          style={{
            borderTop: '1px solid var(--line)',
            margin: '0 -24px -24px',
            padding: '48px 24px',
          }}
        >
          <div className="empty-icon">
            <svg
              fill="none"
              height="24"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <h3>Nog geen automatische leads</h3>
          <p>
            Start het zoekproces — we analyseren openbare bronnen voor
            potentiële kopers die passen bij{' '}
            <strong>{sector || 'jouw sector'}</strong>
            {city ? (
              <>
                {' '}
                in de regio <strong>{city}</strong>
              </>
            ) : null}
            .
          </p>
          <AutoLeadRefreshButton hasLeads={false} variant="start" />
        </div>
      </div>
    )
  }

  return (
    <>
      <Header hasLeads />
      <div className="grid-2 grid">
        {leads.map(lead => (
          <LeadCard key={lead.id} lead={lead} variant="auto" />
        ))}
      </div>
    </>
  )
}
