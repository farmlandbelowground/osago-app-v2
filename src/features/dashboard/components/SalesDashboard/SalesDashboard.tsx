import Link from 'next/link'
import { type FC } from 'react'

import { PipelineBoard } from '@features/leads'
import { UPSELL_OPTIONS } from '@features/leads/constants/upsell'

import { type Props } from './types'

// Sales dashboard (docx §4): full-width kanban + a two-column grid with
// operational to-dos on the left and stage-matched upsells on the right.
// Only upsells whose `stages` intersect the customer's current pipeline
// are rendered — cards that don't apply are hidden per the docx.

const SearchIcon: FC = () => (
  <svg
    fill="none"
    height="16"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="16"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
)

const ArrowIcon: FC = () => (
  <svg
    fill="none"
    height="16"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="16"
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)

const StarIcon: FC = () => (
  <svg
    fill="none"
    height="18"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="18"
  >
    <path d="M12 2 15 8h6l-5 4 2 7-6-4-6 4 2-7-5-4h6z" />
  </svg>
)

interface OperationalTodo {
  href: string
  label: string
}

const OPERATIONAL_TODOS: readonly OperationalTodo[] = [
  { href: '/kopermatching', label: 'Start de automatische leadsidentificatie' },
  { href: '/kopermatching', label: 'Voeg handmatig leads toe' },
  { href: '/verkoopproces', label: 'Interesse van kopers opvolgen' },
]

const upsellMailto = (title: string): string =>
  `mailto:info@osago.nl?subject=${encodeURIComponent(`Osago dienst — ${title}`)}`

export const SalesDashboard: FC<Props> = ({
  companyHasName,
  firstName,
  isMedewerker,
  leads,
}) => {
  const activeStages = new Set(leads.map(lead => lead.stage).filter(Boolean))
  const relevantUpsells = UPSELL_OPTIONS.filter(option =>
    option.stages.some(stage => activeStages.has(stage)),
  )

  return (
    <main className="main">
      <div className="page-header">
        <h1 className="page-title">
          Welkom{firstName ? `, ${firstName}` : ''}.
        </h1>
      </div>

      <div className="card sales-kanban-card">
        <div className="sales-kanban-head">
          <div>
            <h3>Verkoopproces</h3>
            <p className="desc">
              Volg je kopers door de fasen van het verkooptraject.
            </p>
          </div>
          <Link className="btn btn-primary btn-sm" href="/kopermatching">
            <SearchIcon />
            Kopers zoeken
          </Link>
        </div>
        <PipelineBoard
          companyHasName={companyHasName}
          isMedewerker={isMedewerker}
          leads={leads}
        />
      </div>

      <div className="sales-grid">
        <div className="card">
          <div className="sales-todo-head">
            <div>
              <h3>To-do lijst</h3>
              <p className="desc">
                De volgende stappen helpen je om jouw verkooptraject te
                starten.
              </p>
            </div>
          </div>
          <div className="prep-list" style={{ marginTop: 14 }}>
            {OPERATIONAL_TODOS.map(todo => (
              <Link
                className="prep-item current"
                href={todo.href}
                key={todo.label}
              >
                <span className="prep-check" />
                <span className="prep-check-text">{todo.label}</span>
                <span className="prep-check-arrow">
                  <ArrowIcon />
                </span>
              </Link>
            ))}
          </div>
        </div>

        {relevantUpsells.length > 0 && (
          <div className="card">
            <h3 style={{ margin: '0 0 4px' }}>Upgrades</h3>
            <p className="desc" style={{ marginBottom: 14 }}>
              Aanvullende diensten waarmee een Osago-medewerker jou kan
              ondersteunen — afgestemd op de fase waarin jouw kopers
              zitten.
            </p>
            <div className="upsell-list">
              {relevantUpsells.map(option => (
                <div className="upsell-item" key={option.id}>
                  <div className="upsell-head">
                    <span className="upsell-ic">
                      <StarIcon />
                    </span>
                    <div style={{ flex: 1 }}>
                      <div className="upsell-title">{option.title}</div>
                      <div className="upsell-desc">{option.desc}</div>
                    </div>
                  </div>
                  <div className="upsell-foot">
                    <div>
                      <strong className="upsell-price">
                        {option.price}
                      </strong>{' '}
                      <span className="upsell-unit">{option.unit}</span>
                    </div>
                    <a
                      className="btn btn-secondary btn-sm"
                      href={upsellMailto(option.title)}
                    >
                      Afnemen
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
