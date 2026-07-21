import { type FC } from 'react'

import { AddBuyerModal } from '../AddBuyerModal'
import { LeadCard } from '../LeadCard'
import { type Props } from './types'

const Header: FC = () => (
  <div
    className="flex-between mb-4"
    style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}
  >
    <div>
      <h3 style={{ margin: 0 }}>Handmatig toegevoegde leads</h3>
      <p className="desc" style={{ margin: '4px 0 0' }}>
        Leads die je zelf heeft toegevoegd. Klik op &quot;Toevoegen aan
        pipeline&quot; om een lead actief op te nemen in jouw verkoopproces.
      </p>
    </div>
    <AddBuyerModal />
  </div>
)

// Ports renderManualLeadsPanel (osago-bundle.js:20590-20629).
export const ManualLeadsPanel: FC<Props> = ({ leads }) => {
  if (leads.length === 0) {
    return (
      <div className="card">
        <Header />
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
          <h3>Nog geen handmatig toegevoegde leads</h3>
          <p>
            Heb je zelf een potentiële koper geïdentificeerd? Voeg deze toe via
            de knop hierboven. Een lead verschijnt eerst hier als kandidaat —
            pas wanneer je op &quot;Toevoegen aan pipeline&quot; klikt komt deze
            in jouw Verkoopproces.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Header />
      <div className="grid-2 grid">
        {leads.map(lead => (
          <LeadCard key={lead.id} lead={lead} variant="manual" />
        ))}
      </div>
    </>
  )
}
