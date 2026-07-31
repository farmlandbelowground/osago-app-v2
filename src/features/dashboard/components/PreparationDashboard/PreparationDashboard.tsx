import Link from 'next/link'
import { type FC } from 'react'

import {
  PREPARATION_GROUPS,
  type ScreenState,
} from '@features/preparation'
import { cn } from '@shared/utils/cn'

import { type Props } from './types'

// Preparation dashboard (docx §3): one green panel with a 3-segment
// progress bar, "Volgende stap" CTA, and a phased checklist. The next
// screen (first non-done) is highlighted; later screens sit in a locked
// group with a dashed border and a short warning.

const CheckIcon: FC = () => (
  <svg
    fill="none"
    height="14"
    stroke="currentColor"
    strokeWidth="3"
    viewBox="0 0 24 24"
    width="14"
  >
    <path d="M5 13l4 4L19 7" />
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

const LockIcon: FC = () => (
  <svg
    fill="none"
    height="13"
    stroke="currentColor"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
    width="13"
  >
    <rect height="9" rx="1.5" width="14" x="5" y="11" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
)

const WarnIcon: FC = () => (
  <svg
    fill="none"
    height="15"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
    width="15"
  >
    <path d="M12 4 3 19h18L12 4z" />
    <path d="M12 10v3.5M12 16.5h.01" />
  </svg>
)

const ChecklistItem: FC<{ screen: ScreenState }> = ({ screen }) => {
  const content = (
    <>
      <span className="prep-check">
        {screen.status === 'locked' ? <LockIcon /> : <CheckIcon />}
      </span>
      <span className="prep-check-text">{screen.label}</span>
      <span className="prep-check-arrow">
        <ArrowIcon />
      </span>
    </>
  )

  if (screen.status === 'locked') {
    return (
      <span
        aria-disabled="true"
        className={cn('prep-item', 'locked')}
        title="Rond eerst de vorige stap af."
      >
        {content}
      </span>
    )
  }

  return (
    <Link
      className={cn('prep-item', screen.status)}
      href={screen.path}
    >
      {content}
    </Link>
  )
}

export const PreparationDashboard: FC<Props> = ({
  firstName,
  preparation,
}) => {
  const {
    completedCount,
    currentScreen,
    groups,
    screens,
    totalCount,
  } = preparation

  return (
    <main className="main">
      <h1 className="page-title">
        Welkom{firstName ? `, ${firstName}` : ''}.
      </h1>

      <div className="prep-card">
        <div className="prep-head">
          <span className="prep-title">Voorbereiding</span>
          <span className="prep-count">
            {completedCount} / {totalCount} stappen voltooid
          </span>
        </div>

        <div className="prep-segbar">
          {groups.map(group => {
            const frac = Math.min(group.done / Math.max(group.total, 1), 1)
            return (
              <div
                className={cn('prep-seg', frac >= 1 && 'done')}
                key={group.id}
              >
                <span
                  className="prep-seg-fill"
                  style={{ width: `${frac * 100}%` }}
                />
              </div>
            )
          })}
        </div>
        <div className="prep-seg-labels">
          {groups.map(group => (
            <span key={group.id}>{group.label}</span>
          ))}
        </div>

        {currentScreen && (
          <Link className="prep-cta" href={currentScreen.path}>
            <div>
              <small>Volgende stap</small>
              <span className="prep-cta-title">{currentScreen.label}</span>
            </div>
            <span className="prep-cta-btn">
              Ga verder <ArrowIcon />
            </span>
          </Link>
        )}

        <div className="prep-groups">
          {PREPARATION_GROUPS.map(group => {
            const groupScreens = screens.filter(s => s.group === group.id)
            const reached = groupScreens.some(s => s.status !== 'locked')
            const done = groupScreens.filter(s => s.status === 'done').length
            return (
              <div className="prep-group" key={group.id}>
                <div className="prep-group-head">
                  {!reached && <LockIcon />}
                  <span className="deel-n">Stap {group.stepNumber}</span>
                  <span>· {group.label}</span>
                  <span className="prep-group-badge">
                    {done}/{groupScreens.length}
                  </span>
                </div>
                <div className="prep-list">
                  {groupScreens.map(screen => (
                    <ChecklistItem key={screen.id} screen={screen} />
                  ))}
                </div>
                {!reached && (
                  <div className="prep-lock-note">
                    <WarnIcon />
                    <span>
                      Je moet eerst de voorbereiding afronden, voordat je
                      door kunt naar het verkoopproces.
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
