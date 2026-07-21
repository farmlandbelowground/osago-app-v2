import { type FC } from 'react'

import { LeadCard } from '../LeadCard'
import { type Props } from './types'

const Header: FC = () => (
  <div
    className="flex-between mb-4"
    style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}
  >
    <div>
      <h3 style={{ margin: 0 }}>Gevalideerde leads door Osago</h3>
      <p className="desc" style={{ margin: '4px 0 0' }}>
        Leads die handmatig zijn toegevoegd en gevalideerd door een
        Osago-medewerker. Klik op &quot;Toevoegen aan pipeline&quot; om deze
        actief op te nemen in jouw verkoopproces.
      </p>
    </div>
  </div>
)

// Ports renderOsagoValidatedPanel (osago-bundle.js:20890-20924).
export const OsagoValidatedPanel: FC<Props> = ({ leads }) => {
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
              <path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.77l-6.18 3.25L7 13.14 2 8.27l6.91-1.01L12 1z" />
            </svg>
          </div>
          <h3>Nog geen door Osago gevalideerde leads</h3>
          <p>
            Zodra een Osago-medewerker een lead voor je valideert, verschijnt
            deze hier als kandidaat. Je bepaalt zelf of deze in jouw
            verkoopproces wordt opgenomen.
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
          <LeadCard key={lead.id} lead={lead} variant="osago" />
        ))}
      </div>
    </>
  )
}
